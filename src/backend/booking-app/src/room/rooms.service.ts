import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Room, ModerationStatus, RoomStatus } from './entities/room.entity';
import { RoomImage } from './entities/room-image.entity';
import { RoomAmenity } from './entities/room-amenity.entity';
import { User } from '../user/user.entity';
import { FilterRoomDto } from './dto/filter-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { ModerateRoomDto } from './dto/moderate-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(RoomImage)
    private roomImagesRepo: Repository<RoomImage>,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private authService: AuthService,
    private mailService: MailService,
  ) { }

  async findAll(filter: FilterRoomDto) {
    try {
      const {
        city,
        district,
        ward,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        roomType,
        gender,
        hostId,
        amenities,
        sort,
        page = 1,
        limit = 10,
        keyword,
      } = filter;

      if (minPrice && maxPrice && minPrice > maxPrice) {
        throw new BadRequestException('minPrice cannot be greater than maxPrice');
      }

      if (minArea && maxArea && minArea > maxArea) {
        throw new BadRequestException('minArea cannot be greater than maxArea');
      }

      const query = this.roomsRepository
        .createQueryBuilder('room')
        .leftJoinAndSelect('room.roomAmenities', 'roomAmenity')
        .leftJoinAndSelect('roomAmenity.amenity', 'amenity')
        .leftJoinAndSelect('room.images', 'images')
        .where('room.status = :status', { status: 'AVAILABLE' })
        .andWhere('room.moderationStatus = :moderationStatus', { moderationStatus: 'APPROVED' });

      if (keyword) {
        query.andWhere(
          '(room.title ILIKE :keyword OR room.description ILIKE :keyword OR room.address ILIKE :keyword)',
          { keyword: `%${keyword}%` },
        );
      }

      // Location filters - EXACT MATCH
      if (city) {
        query.andWhere('room.city = :city', { city });
      }
      if (district) {
        query.andWhere('room.district = :district', { district });
      }
      if (ward) {
        query.andWhere('room.ward = :ward', { ward });
      }

      // Price filter
      if (minPrice !== undefined) {
        query.andWhere('room.pricePerMonth >= :minPrice', { minPrice });
      }
      if (maxPrice !== undefined) {
        query.andWhere('room.pricePerMonth <= :maxPrice', { maxPrice });
      }

      // Area filter
      if (minArea !== undefined) {
        query.andWhere('room.area >= :minArea', { minArea });
      }
      if (maxArea !== undefined) {
        query.andWhere('room.area <= :maxArea', { maxArea });
      }

      // Room type filter (enum)
      if (roomType) {
        query.andWhere('room.roomType = :roomType', { roomType });
      }

      // Gender filter (enum)
      if (gender) {
        query.andWhere('room.gender = :gender', { gender });
      }

      // Host filter
      if (hostId) {
        query.andWhere('room.hostId = :hostId', { hostId });
      }

      // Amenities filter by name
      if (amenities) {
        const amenityNames = amenities
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        if (amenityNames.length > 0) {
          const subQuery = this.roomsRepository
            .createQueryBuilder('sub_room')
            .select('sub_room.id')
            .innerJoin('sub_room.roomAmenities', 'ra')
            .innerJoin('ra.amenity', 'a')
            .where('a.name IN (:...amenityNames)', { amenityNames })
            .groupBy('sub_room.id')
            .having('COUNT(DISTINCT a.name) = :count', { count: amenityNames.length });

          query.andWhere(`room.id IN (${subQuery.getQuery()})`);
          query.setParameters(subQuery.getParameters());
        }
      }

      // Sorting
      if (sort) {
        const [field, order] = sort.split(':');
        const allowedFields = ['pricePerMonth', 'area', 'createdAt'];
        const allowedOrders = ['ASC', 'DESC'];

        if (allowedFields.includes(field) && allowedOrders.includes(order?.toUpperCase())) {
          query.orderBy(`room.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
        } else {
          query.orderBy('room.createdAt', 'DESC');
        }
      } else {
        query.orderBy('room.createdAt', 'DESC');
      }

      const offset = (page - 1) * limit;
      query.skip(offset).take(limit);

      const [rooms, total] = await query.getManyAndCount();

      return {
        success: true,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
        data: rooms.map((room) => ({
          id: room.id,
          title: room.title,
          description: room.description,
          price: Number(room.pricePerMonth),
          size: room.area,
          location: `${room.ward}, ${room.district}, ${room.city}`,
          address: room.address,
          status: room.status,
          roomType: room.roomType,
          gender: room.gender,
          amenities: room.roomAmenities?.map((ra) => ({
            id: ra.amenity.id,
            name: ra.amenity.name,
          })) || [],
          images: room.images?.map((img) => ({
            id: img.id,
            url: img.imageUrl,
            isThumbnail: img.isThumbnail,
          })) || [],
          available: room.status === 'AVAILABLE',
        })),
      };
    } catch (error) {
      console.error('LỖI THỰC SỰ LÀ:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid filter parameters');
    }
  }

  async findOne(id: number) {
    const room = await this.roomsRepository.findOne({
      where: {
        id,
        status: RoomStatus.AVAILABLE,
        moderationStatus: ModerationStatus.APPROVED
      },
      relations: [
        'host',
        'images',
        'roomAmenities',
        'roomAmenities.amenity',
        'watchList',
      ],
    });

    if (!room) {
      // Nếu phòng tồn tại nhưng status là PENDING, hàm này vẫn trả về null -> 404
      // Điều này bảo mật, khách sẽ nghĩ phòng này không tồn tại.
      throw new NotFoundException(`Room with ID ${id} not found or not available`);
    }

    return room;
  }

  async findOneForAdmin(id: number) {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: [
        'host',
        'images',
        'roomAmenities',
        'roomAmenities.amenity',
      ],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async create(createRoomDto: CreateRoomDto, files: Array<Express.Multer.File>, reqUser: User) {
    const user = await this.usersRepository.findOneBy({ id: reqUser.id });

    let status = ModerationStatus.DRAFT;
    let message = 'Tin đã được lưu nháp.';
    let requireVerification = false;

    // Nếu người dùng MUỐN ĐĂNG TIN (isDraft = false)
    if (user && !createRoomDto.isDraft) {
      if (user.isActive) {
        status = ModerationStatus.PENDING; // Đủ điều kiện -> Chờ duyệt
        message = 'Tin đang chờ Admin phê duyệt.';
      } else {
        // Muốn đăng nhưng chưa active -> Vẫn lưu nháp và báo cần active
        status = ModerationStatus.DRAFT;
        message = 'Tin lưu nháp. Vui lòng xác thực email để gửi duyệt.';
        requireVerification = true;
      }
    }

    const room = new Room();

    // Thông tin cơ bản
    if (user)
      room.host = user;
    room.title = createRoomDto.title;
    room.description = createRoomDto.description;
    room.roomType = createRoomDto.roomType;
    room.status = RoomStatus.AVAILABLE;
    room.moderationStatus = status;

    // Vị trí
    room.city = createRoomDto.province;
    room.district = createRoomDto.district;
    room.ward = createRoomDto.ward;
    room.address = createRoomDto.address;
    room.latitude = createRoomDto.latitude;
    room.longitude = createRoomDto.longitude;

    // Thông số & Giá
    room.area = createRoomDto.area;
    room.guestCapacity = createRoomDto.guestCapacity;
    room.pricePerMonth = createRoomDto.pricePerMonth;
    room.deposit = createRoomDto.deposit;
    room.minLeaseTerm = createRoomDto.minLeaseTerm;

    // Chi phí
    room.electricityPrice = createRoomDto.electricityPrice;
    room.electricityUnit = createRoomDto.electricityUnit;
    room.waterPrice = createRoomDto.waterPrice;
    room.waterUnit = createRoomDto.waterUnit;
    room.wifiPrice = createRoomDto.wifiPrice;
    room.parkingFee = createRoomDto.parkingFee;
    room.managementFee = createRoomDto.managementFee;
    room.miscNotes = createRoomDto.miscNotes ?? null;

    // Tiện ích & Quy định
    room.cookingAllowed = createRoomDto.cookingAllowed;
    room.petAllowed = createRoomDto.petAllowed;
    room.gender = createRoomDto.gender;
    room.curfew = createRoomDto.curfew;
    room.curfewTime = createRoomDto.curfewTime ?? null;

    // Liên hệ 
    room.contactName = createRoomDto.contactName;
    room.phone = createRoomDto.phone;

    //  XỬ LÝ ẢNH
    const roomImages: RoomImage[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file, index) => {
        const uploadResult = await this.cloudinaryService.uploadImage(file);

        const img = new RoomImage();
        img.imageUrl = uploadResult.secure_url;
        img.publicId = uploadResult.public_id;
        img.isThumbnail = index === createRoomDto.coverImageIndex;

        return img;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      roomImages.push(...uploadedImages);
    }
    room.images = roomImages;

    // XỬ LÝ TIỆN ÍCH 
    // frontend gửi dạng mảng string ID: ["1", "5"]
    if (createRoomDto.amenities && createRoomDto.amenities.length > 0) {
      room.roomAmenities = createRoomDto.amenities.map((amenityId) => {
        const ra = new RoomAmenity();
        ra.amenityId = Number(amenityId);
        return ra;
      });
    }

    const savedRoom = await this.roomsRepository.save(room);

    if (user && !user.isHost) {
      await this.usersRepository.update(user.id, { isHost: true });
    }
    if (requireVerification && user) {
      this.authService.sendVerificationEmail(user.id).catch(err => {
        console.error("Lỗi gửi mail:", err);
      });
    }
    return {
      success: true,
      data: savedRoom,
      meta: {
        message,
        requireVerification,
        status
      },
    };
  }

  async findByHost(hostId: number) {
    return this.roomsRepository.find({
      where: { host: { id: hostId } },
      relations: ['images', 'roomAmenities'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForHost(roomId: number, hostId: number) {
    const room = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: [
        'images',
        'roomAmenities',
        'roomAmenities.amenity'
      ],
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng với ID ${roomId}`);
    }

    if (room.hostId !== hostId) {
      throw new ForbiddenException('Không có quyền xem hoặc chỉnh sửa phòng này');
    }

    return room;
  }

  async getPendingRooms() {
    return this.roomsRepository.find({
      where: {
        moderationStatus: ModerationStatus.PENDING
      },
      relations: ['images', 'host'],
      order: { createdAt: 'ASC' },
    });
  }


  async moderateRoom(id: number, dto: ModerateRoomDto) {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['host']
    });

    if (!room) throw new NotFoundException('Room not found');

    room.moderationStatus = dto.decision;
    room.moderationNotes = dto.reason || '';

    if (dto.decision === ModerationStatus.APPROVED) {
      room.status = RoomStatus.AVAILABLE;
    } else if (dto.decision === ModerationStatus.NEEDS_EDIT) {
      room.status = RoomStatus.PENDING;
    } else if (dto.decision === ModerationStatus.REJECTED) {
      room.status = RoomStatus.HIDDEN;
    }

    await this.roomsRepository.save(room);

    this.mailService.sendModerationResult(
      room.host,
      room.title,
      dto.decision,
      dto.reason,
      room.id
    ).catch(e => console.log('Lỗi gửi mail:', e));

    return { success: true };;
  }

  async update(id: number, dto: UpdateRoomDto, files: Array<Express.Multer.File>, user: User) {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['images', 'host'],
    });

    if (!room) throw new NotFoundException('Không tìm thấy phòng trọ');

    if (room.hostId !== user.id) {
      throw new ForbiddenException('Không có quyền chỉnh sửa phòng này');
    }

    if (dto.deleteImageIds && dto.deleteImageIds.length > 0) {
      const imagesToDelete = await this.roomImagesRepo.find({
        where: {
          id: In(dto.deleteImageIds),
          roomId: room.id
        }
      });

      for (const img of imagesToDelete) {
        await this.cloudinaryService.deleteFile(img.publicId);
      }

      if (imagesToDelete.length > 0) {
        await this.roomImagesRepo.remove(imagesToDelete);
      }
    }

    // 3. Xử lý upload ảnh mới
    let newImageIds: number[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.cloudinaryService.uploadImage(file));
      const uploadResults = await Promise.all(uploadPromises);

      // Tạo entity RoomImage mới (chưa set thumbnail ở đây)
      const newImages = uploadResults.map((result) => {
        return this.roomImagesRepo.create({
          room: room,
          imageUrl: result.secure_url,
          publicId: result.public_id,
          isThumbnail: false // Tạm thời set false
        });
      });

      const savedImages = await this.roomImagesRepo.save(newImages);
      newImageIds = savedImages.map(img => img.id);
    }

    // 4. Xử lý thumbnail: Reset tất cả về false trước
    await this.roomImagesRepo.update(
      { roomId: room.id },
      { isThumbnail: false }
    );

    // 5. Set thumbnail cho ảnh được chọn
    if (dto.coverImageId) {
      // User chọn ảnh cũ làm thumbnail
      const existingImage = await this.roomImagesRepo.findOne({
        where: { id: dto.coverImageId, roomId: room.id }
      });

      if (existingImage) {
        await this.roomImagesRepo.update(
          { id: dto.coverImageId },
          { isThumbnail: true }
        );
      }
    } else if (dto.newCoverIndex !== undefined && dto.newCoverIndex !== null && newImageIds.length > 0) {
      // User chọn ảnh mới làm thumbnail
      const newCoverId = newImageIds[dto.newCoverIndex];
      if (newCoverId) {
        await this.roomImagesRepo.update(
          { id: newCoverId },
          { isThumbnail: true }
        );
      }
    }

    const { deleteImageIds, ...updateData } = dto;
    Object.assign(room, updateData);

    if (!dto.isDraft) {
      if (room.moderationStatus !== ModerationStatus.PENDING) {
        room.moderationStatus = ModerationStatus.PENDING;
        room.status = RoomStatus.PENDING;
        room.moderationNotes = '';
      }
    } else {
      room.moderationStatus = ModerationStatus.DRAFT;
      room.status = RoomStatus.PENDING;
    }

    delete room.images;
    const updatedRoom = await this.roomsRepository.save(room);

    return {
      success: true,
      message: 'Cập nhật tin đăng thành công',
      data: updatedRoom
    };
  }

  async delete(id: number, user: User) {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['images', 'host'],
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng trọ');
    }

    if (room.hostId !== user.id) {
      throw new ForbiddenException('Không có quyền xóa phòng này');
    }

    // Xóa tất cả ảnh trên Cloudinary
    if (room.images && room.images.length > 0) {
      for (const img of room.images) {
        if (img.publicId) {
          try {
            await this.cloudinaryService.deleteFile(img.publicId);
          } catch (error) {
            console.error(`Lỗi khi xóa ảnh ${img.publicId}:`, error);
          }
        }
      }
    }

    await this.roomsRepository.remove(room);

    return {
      success: true,
      message: 'Xóa tin đăng thành công'
    };
  }

  // 2 hàm cho tính năng watchlist

  async toggleSaveRoom(roomId: number, userId: number) {
    const room = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['watchList'],
    });
    if (!room) throw new NotFoundException('Room not found');

    const isSaved = room.watchList.some(user => user.id === userId);
    if (isSaved) {
      room.watchList = room.watchList.filter(user => user.id !== userId);
    } else {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (user)
        room.watchList.push(user);
    }

    await this.roomsRepository.save(room);
    return { saved: !isSaved };
  }
  async getUserWatchlist(userId: number) {
    const rooms = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.roomAmenities', 'roomAmenity')
      .leftJoinAndSelect('roomAmenity.amenity', 'amenity')
      .leftJoinAndSelect('room.images', 'images')
      .innerJoin('room.watchList', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    return { // giống format của tính năn search
      success: true,
      data: rooms.map((room) => ({
        id: room.id,
        title: room.title,
        description: room.description,
        price: Number(room.pricePerMonth),
        size: room.area,
        location: `${room.ward}, ${room.district}, ${room.city}`,
        address: room.address,
        status: room.status,
        roomType: room.roomType,
        gender: room.gender,
        amenities: room.roomAmenities?.map((ra) => ({
          id: ra.amenity.id,
          name: ra.amenity.name,
        })) || [],
        images: room.images?.map((img) => ({
          id: img.id,
          url: img.imageUrl,
          isThumbnail: img.isThumbnail,
        })) || [],
        available: room.status === 'AVAILABLE',
      })),
    };
  }

  async incrementViews(id: number): Promise<void> {
    await this.roomsRepository.increment({ id }, 'totalViews', 1);
  }

}
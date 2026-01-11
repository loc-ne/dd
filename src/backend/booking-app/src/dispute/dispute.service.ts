import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Dispute, DisputeStatus } from './entities/dispute.entity';
import { Booking } from '../booking/entities/booking.entity';
import { BookingStatus } from '../booking/booking.constant';
import { User } from '../user/user.entity';
import { PaymentService } from '../payment/payment.service';
import { MailService } from '../mail/mail.service';
import { Room } from '../room/entities/room.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly paymentService: PaymentService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Dispute cho Guest
   * Logic:
   * 1. Kiểm tra booking tồn tại
   * 2. Xác minh user là renter của booking
   * 3. Kiểm tra booking có trạng thái hợp lệ (CONFIRMED hoặc APPROVED)
   * 4. Đảm bảo chưa có dispute nào cho booking này
   * 5. Upload ảnh minh chứng lên Cloudinary (nếu có)
   * 6. Tạo dispute mới với status PENDING_REVIEW
   */
  async createDispute(
    createDisputeDto: CreateDisputeDto,
    renterId: number,
    files?: Array<Express.Multer.File>,
  ): Promise<Dispute> {
    const { bookingId, reason } = createDisputeDto;

    // 1. Kiểm tra booking tồn tại
    const booking = await this.bookingRepository.findOne({
      where: { id: Number(bookingId) },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking với ID ${bookingId} không tồn tại`,
      );
    }

    // 2. Xác minh user là renter của booking
    if (booking.renterId !== renterId) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo dispute cho booking này',
      );
    }

    // 3. Kiểm tra booking có trạng thái hợp lệ
    const validStatuses = [BookingStatus.CONFIRMED, BookingStatus.APPROVED];
    if (!validStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Chỉ có thể tạo dispute cho booking có trạng thái CONFIRMED hoặc APPROVED. Trạng thái hiện tại: ${booking.status}`,
      );
    }

    // 4. Đảm bảo chưa có dispute nào cho booking này
    const existingDispute = await this.disputeRepository.findOne({
      where: { bookingId: Number(bookingId) },
    });

    if (existingDispute) {
      throw new BadRequestException(
        `Booking này đã có dispute với ID ${existingDispute.id}`,
      );
    }

    // 5. Upload ảnh minh chứng lên Cloudinary
    let evidenceImages: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => 
        this.cloudinaryService.uploadImage(file)
      );
      const results = await Promise.all(uploadPromises);
      evidenceImages = results.map(result => result.public_id);
    }

    // 6. Tạo dispute mới
    const dispute = this.disputeRepository.create({
      bookingId: Number(bookingId),
      renterId,
      reason,
      evidenceImages: evidenceImages.length > 0 ? evidenceImages : null,
      status: DisputeStatus.PENDING_REVIEW,
      refundAmount: 0,
    });

    return await this.disputeRepository.save(dispute);
  }

  /**
   * Xử lý dispute cho Admin
   * Logic:
   * 0. Kiểm tra quyền admin
   * 1. Kiểm tra dispute tồn tại
   * 2. Kiểm tra dispute đang ở trạng thái PENDING_REVIEW
   * 3. Cập nhật status, adminDecisionNote, và refundAmount
   * 4. Nếu RESOLVED_REFUND, validate refundAmount <= depositAmount
   * 5. Lưu thông tin quyết định của admin
   * 6. Xử lý hoàn tiền thực tế (nếu RESOLVED_REFUND)
   * 7. Gửi email thông báo cho renter và host
   */
  async resolveDispute(
    disputeId: number,
    resolveDisputeDto: ResolveDisputeDto,
    adminId: number,
  ): Promise<Dispute> {
    const { status, reason, refundAmount } = resolveDisputeDto;

    // 0. Kiểm tra quyền admin
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin || !admin.isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập. Chỉ admin mới có thể giải quyết dispute',
      );
    }

    // 1. Kiểm tra dispute tồn tại với đầy đủ relations
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['booking', 'booking.room', 'renter'],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute với ID ${disputeId} không tồn tại`);
    }

    // 2. Kiểm tra dispute đang ở trạng thái PENDING_REVIEW
    if (dispute.status !== DisputeStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Dispute này đã được xử lý với trạng thái: ${dispute.status}`,
      );
    }

    // 3. Validate refundAmount nếu status là RESOLVED_REFUND
    if (status === DisputeStatus.RESOLVED_REFUND) {
      if (refundAmount <= 0) {
        throw new BadRequestException(
          'Số tiền hoàn trả phải lớn hơn 0 khi chấp nhận dispute',
        );
      }

      // Kiểm tra refundAmount không vượt quá depositAmount
      if (dispute.booking && refundAmount > dispute.booking.depositAmount) {
        throw new BadRequestException(
          `Số tiền hoàn trả (${refundAmount}) không được vượt quá số tiền đặt cọc (${dispute.booking.depositAmount})`,
        );
      }
    }

    // Lấy thông tin host từ room
    const room = await this.roomRepository.findOne({
      where: { id: dispute.booking.roomId },
      relations: ['host'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // 4 & 5 & 6 & 7: Xử lý trong transaction để đảm bảo tính nhất quán
    return await this.dataSource.transaction(async (manager) => {
      // 4. Cập nhật dispute
      dispute.status = status;
      dispute.adminDecisionNote = reason;
      dispute.refundAmount = refundAmount;
      const savedDispute = await manager.save(dispute);

      // 5 & 6. Xử lý theo trường hợp
      if (status === DisputeStatus.RESOLVED_REFUND) {
        // Cập nhật booking status
        dispute.booking.status = BookingStatus.CANCELLED_BY_HOST;
        dispute.booking.cancelReason = `Dispute approved - Refund: ${refundAmount} VND`;
        await manager.save(dispute.booking);

        // Tạo transaction record cho refund
        const transactionId = `REFUND_${dispute.bookingId}_${Date.now()}`;
        await this.paymentService.createTransaction(
          dispute.bookingId,
          dispute.renterId,
          refundAmount,
          transactionId,
          `Refund for dispute #${disputeId} - ${reason}`,
        );

        // Xử lý hoàn tiền thực tế qua VNPay
        // try {
        //   const refundResult = await this.paymentService.processRefund(
        //     dispute.bookingId,
        //     refundAmount,
        //   );
          
        //   if (refundResult.success) {
        //     console.log('✅ Refund successful:', refundResult.message);
        //   } else {
        //     console.error('❌ Refund failed:', refundResult.message);
        //   }
        // } catch (error) {
        //   // Log error nhưng không throw để không rollback transaction
        //   console.error('Refund processing error:', error);
        // }

        // 7. Gửi email cho renter (approved)
        await this.mailService.sendDisputeResult(
          dispute.renter,
          dispute.booking.room.title,
          'APPROVED',
          refundAmount,
          reason,
        );

        // Gửi email cho host
        await this.mailService.sendDisputeResultHost(
          room.host,
          dispute.booking.room.title,
          dispute.renter.fullName,
          'APPROVED',
          refundAmount,
          reason,
        );
      } else if (status === DisputeStatus.RESOLVED_DENIED) {
        // 7. Gửi email cho renter (denied)
        await this.mailService.sendDisputeResult(
          dispute.renter,
          dispute.booking.room.title,
          'DENIED',
          0,
          reason,
        );

        // Gửi email cho host
        await this.mailService.sendDisputeResultHost(
          room.host,
          dispute.booking.room.title,
          dispute.renter.fullName,
          'DENIED',
          0,
          reason,
        );
      }

      return savedDispute;
    });
  }

  /**
   * Lấy danh sách các dispute đang chờ xử lý
   * Trả về mảng các dispute có status PENDING_REVIEW
   */
  async getPendingDisputes(): Promise<Dispute[]> {
    return await this.disputeRepository.find({
      where: { status: DisputeStatus.PENDING_REVIEW },
      relations: ['booking', 'booking.room', 'booking.room.images', 'renter'],
      order: { createdAt: 'DESC' },
    });
  }
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private cloudinaryService: CloudinaryService,
  ) { }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      updateUserDto.avatarUrl = uploadResult.secure_url;
    }

    Object.assign(user, updateUserDto);

    return await this.usersRepository.save(user);
  }

  async updateEmailVerified(id: string) {
    return await this.usersRepository.update(id, {
      isActive: true,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'passwordHash', 'fullName', 'isActive', 'isHost', 'isAdmin']
    });
  }

  async findAll(search?: string): Promise<User[]> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.fullName LIKE :search OR user.email LIKE :search',
        { search: `%${search}%` }
      );
    }

    return await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  async lockUser(id: number, reason: string): Promise<User> {
    const user = await this.findById(id);

    // Kiểm tra bằng lockReason thay vì isActive
    // Vì isActive = false có thể là chưa xác minh email
    if (user.lockReason) {
      throw new BadRequestException('Tài khoản đã bị khóa');
    }

    if (user.isAdmin) {
      throw new BadRequestException('Không thể khóa tài khoản Admin');
    }

    if (!reason || !reason.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do khóa tài khoản');
    }

    user.lockReason = reason.trim();
    return await this.usersRepository.save(user);
  }

  async unlockUser(id: number): Promise<User> {
    const user = await this.findById(id);

    // Kiểm tra bằng lockReason
    if (!user.lockReason) {
      throw new BadRequestException('Tài khoản chưa bị khóa');
    }

    user.lockReason = null as any;
    return await this.usersRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findById(id);

    if (user.isAdmin) {
      throw new BadRequestException('Không thể xóa tài khoản Admin');
    }

    await this.usersRepository.remove(user);
  }

}
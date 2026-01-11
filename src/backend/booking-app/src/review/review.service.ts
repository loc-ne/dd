import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { Booking } from '../booking/entities/booking.entity';
import { BookingStatus } from '../booking/booking.constant';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Tạo review mới cho một booking
   * @param renterId - ID của người thuê (từ JWT)
   * @param createReviewDto - DTO chứa bookingId, rating, comment
   * @returns Review đã tạo
   */
  async create(renterId: number, createReviewDto: CreateReviewDto): Promise<Review> {
    const { bookingId, rating, comment } = createReviewDto;

    // Kiểm tra booking tồn tại và thuộc về renter
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, renterId },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại hoặc không thuộc về bạn');
    }

    // Kiểm tra booking đã hoàn thành (CONFIRMED = đã thanh toán = hoàn thành)
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Chỉ có thể đánh giá booking đã xác nhận');
    }

    // Kiểm tra đã review chưa
    const existingReview = await this.reviewRepository.findOne({
      where: { bookingId, renterId },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá booking này rồi');
    }

    // Tạo review mới
    const review = this.reviewRepository.create({
      bookingId,
      renterId,
      roomId: booking.roomId,
      rating,
      comment,
    });

    return this.reviewRepository.save(review);
  }

  /**
   * Lấy tất cả reviews
   */
  findAll(): Promise<Review[]> {
    return this.reviewRepository.find({
      relations: ['renter', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy review theo ID
   */
  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['renter', 'room'],
    });

    if (!review) {
      throw new NotFoundException(`Review #${id} không tồn tại`);
    }

    return review;
  }

  /**
   * Cập nhật review
   */
  async update(id: number, renterId: number, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id, renterId },
    });

    if (!review) {
      throw new NotFoundException('Review không tồn tại hoặc không thuộc về bạn');
    }

    Object.assign(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  /**
   * Xóa review
   */
  async remove(id: number, renterId: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id, renterId },
    });

    if (!review) {
      throw new NotFoundException('Review không tồn tại hoặc không thuộc về bạn');
    }

    await this.reviewRepository.remove(review);
  }

  /**
   * Lấy danh sách reviews theo roomId
   * @param roomId - ID của phòng
   * @returns Mảng Review của phòng đó
   */
  async getByRoom(roomId: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { roomId },
      relations: ['renter'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Tính điểm đánh giá trung bình của phòng
   * @param roomId - ID của phòng
   * @returns Điểm trung bình (0 nếu chưa có review)
   */
  async getAverageRating(roomId: number): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.room_id = :roomId', { roomId })
      .select('AVG(review.rating)', 'avgRating')
      .getRawOne();

    return Number(result?.avgRating || 0);
  }
}

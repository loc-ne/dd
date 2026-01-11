import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReview } from './user-review.entity';
import { User } from '../user/user.entity';
import { Booking } from '../booking/entities/booking.entity';
import { BookingStatus } from '../booking/booking.constant';
import { CreateUserReviewDto } from './dto/create-user-review.dto';
import { GetUserReviewsDto } from './dto/get-user-reviews.dto';
import { UpdateUserReviewDto } from './dto/update-user-review.dto';
import { UserReviewResponseDto } from './dto/user-review-response.dto';

@Injectable()
export class UserReviewService {
    constructor(
        @InjectRepository(UserReview)
        private readonly reviewRepo: Repository<UserReview>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Booking)
        private readonly bookingRepo: Repository<Booking>,
    ) {}

    async createReview(
        reviewerId: number,
        hostId: number,
        dto: CreateUserReviewDto,
    ) {
        if (reviewerId === hostId) {
            throw new BadRequestException('Bạn không thể tự đánh giá chính mình');
        }

        const host = await this.userRepo.findOne({
            where: { id: hostId, isHost: true },
        });
        if (!host) {
            throw new NotFoundException('Không tìm thấy chủ nhà');
        }

        const reviewer = await this.userRepo.findOne({
            where: { id: reviewerId },
        });
        if (!reviewer) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        // ✅ Kiểm tra reviewer phải có booking CONFIRMED với host này
        const confirmedBooking = await this.bookingRepo.findOne({
            where: {
                renterId: reviewerId,
                status: BookingStatus.CONFIRMED,
            },
            relations: ['room'],
        });

        if (!confirmedBooking) {
            throw new BadRequestException(
                'Bạn cần có đơn đặt phòng đã thanh toán thành công để đánh giá chủ nhà'
            );
        }

        // Kiểm tra phòng của booking có thuộc về host này không
        const roomBelongsToHost = await this.bookingRepo
            .createQueryBuilder('booking')
            .innerJoin('booking.room', 'room')
            .where('booking.renter_id = :renterId', { renterId: reviewerId })
            .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
            .andWhere('room.host_id = :hostId', { hostId })
            .getOne();

        if (!roomBelongsToHost) {
            throw new BadRequestException(
                'Bạn chỉ có thể đánh giá chủ nhà mà bạn đã thuê phòng và thanh toán thành công'
            );
        }

        const review = this.reviewRepo.create({
            reviewer,
            host,
            rating: dto.rating,
            comment: dto.comment,
        });

        try {
            const savedReview = await this.reviewRepo.save(review);
            await this.updateHostRating(hostId);
            return savedReview;
        } catch (error) {
            if (
            error instanceof QueryFailedError &&
            (error as any).code === '23505'
            ) {
                throw new ConflictException(
                    'Bạn đã đánh giá chủ nhà này rồi',
                );
            }
            throw error;
        }
    }

    //   async getReviewsByHost(hostId: number) {
    //     return this.reviewRepo.find({
    //       where: { host: { id: hostId } },
    //       relations: ['reviewer'],
    //       order: { createdAt: 'DESC' },
    //     });
    //   }
    //
    async getReviewsByHost(
        hostId: number,
        query: GetUserReviewsDto,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const [reviews, total] = await this.reviewRepo.findAndCount({
            where: { host: { id: hostId } },
            relations: ['reviewer'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        const data: UserReviewResponseDto[] =
        reviews.map((review) => this.toResponseDto(review));

        return {
            data,
            pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Mapper để che dấu các thông tin về người dùng quan trọng trong response khi gọi
    // GET hosts/:hostId/reviews
    // tránh lộ Dbschema, frontend phụ thuộc nhiều vào cấu trúc database
    private toResponseDto(
        review: UserReview,
    ): UserReviewResponseDto {
        return {
            id: review.id,
            rating: Number(review.rating),
            comment: review.comment,
            createdAt: review.createdAt,
            reviewer: {
            id: review.reviewer.id,
            fullName: review.reviewer.fullName,
            avatarUrl: review.reviewer.avatarUrl,
            },
        };
    }


    // Cập nhật rating, lấy record từ table review, tính avg rồi để kết quả vào table user
    // Có thể cải thiện bằng thuật toán incremental (ko cần tính avg mỗi lần thêm)
    // nhưng phải cài đặt các trường hợp thêm/sửa/xóa
    async updateHostRating(hostId: number) {
        const result = await this.reviewRepo
            .createQueryBuilder('r')
            .select('ROUND(AVG(r.rating), 3)', 'avg_rating')
            .addSelect('COUNT(*)', 'review_count')
            .where('r.host_id = :hostId', { hostId })
            .getRawOne();

        await this.userRepo.update(hostId, {
            avgRating: result.avg_rating,
            reviewCount: result.review_count,
        });
    }

    // User chỉnh sửa review của mình
    async updateReview(
    reviewerId: number,
    hostId: number,
    reviewId: number,
    dto: UpdateUserReviewDto,
    ) {
        const review = await this.reviewRepo.findOne({
            where: {
            id: reviewId,
            host: { id: hostId },
            },
            relations: ['reviewer', 'host'],
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.reviewer.id !== reviewerId) {
            throw new ForbiddenException(
            'You can only edit your own review',
            );
        }

        const oldRating = review.rating;
        const newRating =
            dto.rating !== undefined ? dto.rating : oldRating;

        // update fields
        review.rating = newRating;
        if (dto.comment !== undefined) {
            review.comment = dto.comment;
        }

        await this.reviewRepo.save(review);

        // ✅ update avg_rating only if rating changed (theo kiểu incremental để nhanh hơn)
        if (newRating !== oldRating) {
            await this.updateHostRatingAfterEdit(
            hostId,
            oldRating,
            newRating,
            );
        }

        return review;
    }
    async updateHostRatingAfterEdit(
        hostId: number,
        oldRating: number,
        newRating: number,
    ) {
        await this.userRepo
            .createQueryBuilder()
            .update()
            .set({
            avgRating: () =>
                `"avg_rating" + (${newRating} - ${oldRating})::float / "review_count"`,
            })
            .where('id = :hostId', { hostId }) 
            .execute();
    }
}

import { Module } from '@nestjs/common';
import { UserReviewController } from './user-review.controller';
import { UserReviewService } from './user-review.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReview } from './user-review.entity';
import { User } from 'src/user/user.entity';
import { Booking } from '../booking/entities/booking.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserReview, User, Booking]),
    AuthModule
],
  controllers: [UserReviewController],
  providers: [UserReviewService]
})
export class UserReviewModule {}

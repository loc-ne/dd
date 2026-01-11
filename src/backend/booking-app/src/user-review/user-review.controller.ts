import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  ParseIntPipe,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { UserReviewService } from './user-review.service';
import { CreateUserReviewDto } from './dto/create-user-review.dto';
import { GetUserReviewsDto } from './dto/get-user-reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserReviewDto } from './dto/update-user-review.dto';

//POST /hosts/:hostId/reviews
//GET /hosts/:hostId/reviews

@Controller('hosts/:hostId/reviews')
export class UserReviewController {
  constructor(private readonly userReviewService: UserReviewService) {}

  // User đánh giá host
  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('hostId', ParseIntPipe) hostId: number,
    @Body() dto: CreateUserReviewDto,
    @Req() req: any, // req.user.id từ JWT
  ) {
    const reviewerId = req.user.id;
    return this.userReviewService.createReview(
      reviewerId,
      hostId,
      dto,
    );
  }

  // Lấy danh sách review của host
  @Get()
  getHostReviews(
    @Param('hostId', ParseIntPipe) hostId: number,
    @Query() query: GetUserReviewsDto,
  ) {
    return this.userReviewService.getReviewsByHost(hostId, query);
  }

  // Update review
  @Patch(':reviewId')
  @UseGuards(JwtAuthGuard)
  updateReview(
    @Param('hostId', ParseIntPipe) hostId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() dto: UpdateUserReviewDto,
    @Req() req: any,
  ) {
    return this.userReviewService.updateReview(
      req.user.id,
      hostId,
      reviewId,
      dto,
    );
  }
}

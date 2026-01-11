import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * POST /review
   * Tạo review mới (yêu cầu đăng nhập)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    const renterId = req.user.id;
    return this.reviewService.create(renterId, createReviewDto);
  }

  /**
   * GET /review
   * Lấy tất cả reviews
   */
  @Get()
  findAll() {
    return this.reviewService.findAll();
  }

  /**
   * GET /review/room/:roomId
   * Lấy danh sách reviews theo phòng
   */
  @Get('room/:roomId')
  getByRoom(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.reviewService.getByRoom(roomId);
  }

  /**
   * GET /review/room/:roomId/average
   * Lấy điểm đánh giá trung bình của phòng
   */
  @Get('room/:roomId/average')
  getAverageRating(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.reviewService.getAverageRating(roomId);
  }

  /**
   * GET /review/:id
   * Lấy review theo ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.findOne(id);
  }

  /**
   * PATCH /review/:id
   * Cập nhật review (yêu cầu đăng nhập)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    const renterId = req.user.id;
    return this.reviewService.update(id, renterId, updateReviewDto);
  }

  /**
   * DELETE /review/:id
   * Xóa review (yêu cầu đăng nhập)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const renterId = req.user.id;
    return this.reviewService.remove(id, renterId);
  }
}

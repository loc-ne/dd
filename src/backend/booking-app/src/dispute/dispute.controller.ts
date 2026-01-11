import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards, 
  Req, 
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('dispute')
@UseGuards(JwtAuthGuard) 
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  /**
   * [GUEST/RENTER] Tạo khiếu nại mới cho một đơn đặt phòng
   * Body: { bookingId: number, reason: string }
   * Files: images[] (optional)
   */
  @Post('create')
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @Body() createDisputeDto: CreateDisputeDto, 
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any
  ) {
    // Lấy ID người dùng từ Token để đảm bảo tính chính xác và bảo mật
    const renterId = req.user.id; 
    const data = await this.disputeService.createDispute(createDisputeDto, renterId, files);
    
    return { 
      success: true, 
      msg: 'Gửi khiếu nại thành công. Admin sẽ xem xét trong 24-48h.', 
      data 
    };
  }

  /**
   * [ADMIN] Lấy danh sách các khiếu nại đang chờ xử lý (PENDING)
   */
  @Get('pending')
  async getPending() {
    const data = await this.disputeService.getPendingDisputes();
    return { 
      success: true, 
      data 
    };
  }

  /**
   * [ADMIN] Xử lý khiếu nại (Chấp nhận hoàn tiền hoặc Từ chối)
   * URL: PATCH /dispute/resolve/1
   */
  @Patch('resolve/:id')
  async resolve(
    @Param('id', ParseIntPipe) id: number, 
    @Body() resolveDisputeDto: ResolveDisputeDto,
    @Req() req: any
  ) {
    const adminId = req.user.id;
    const data = await this.disputeService.resolveDispute(id, resolveDisputeDto, adminId);
    
    return { 
      success: true, 
      msg: 'Xử lý khiếu nại thành công', 
      data 
    };
  }

}
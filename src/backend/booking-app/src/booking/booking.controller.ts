import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ProcessBookingDto } from './dto/process-booking.dto';
import { ProcessBookingStatus } from './booking.constant';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateBookingDto) {
    const data = await this.bookingService.create(req.user.id, dto);
    return { success: true, msg: 'Booking created successfully', data };
  }

  @Get('my-bookings')
  async getMyBookings(@Req() req) {
    const data = await this.bookingService.getMyBookings(req.user.id);
    return { success: true, msg: 'Success', data };
  }

  @Get('host-bookings')
  async getHostBookings(@Req() req) {
    const data = await this.bookingService.getHostBookings(req.user.id);
    return { success: true, msg: 'Success', data };
  }

  @Patch('host-process/:id')
  async hostProcess(@Param('id') id: number, @Body() dto: ProcessBookingDto, @Req() req) {
    let data;
    if (dto.status === ProcessBookingStatus.APPROVED) {
      data = await this.bookingService.approve(req.user.id, id);
    } else {
      data = await this.bookingService.reject(req.user.id, id, dto.rejectReason || 'No reason provided');
    }
    return { success: true, msg: 'Process completed', data };
  }

  @Post('cancel/:id')
  async cancel(@Req() req, @Param('id') id: number, @Body('reason') reason: string) {
    await this.bookingService.cancelByRenter(req.user.id, id, reason);
    return { success: true, msg: 'Booking cancelled', data: true };
  }
}
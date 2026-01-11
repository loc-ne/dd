import { Controller, Post, Get, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Request } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingService } from '../booking/booking.service';
import { TransactionStatus } from './payment.constant';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly bookingService: BookingService,
  ) {}

  @Post('create-vnpay-url')
  @UseGuards(JwtAuthGuard)
  async createVnpayPaymentUrl(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const ipAddr = (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Validate booking tồn tại và thuộc về user
    const booking = await this.bookingService.findOne(dto.bookingId);
    if (!booking || booking.renterId !== req.user.id) {
      throw new BadRequestException('Invalid booking');
    }

    if (booking.status !== 'APPROVED') {
      throw new BadRequestException('Booking must be APPROVED to make payment');
    }

    const orderId = `BK${dto.bookingId}_${Date.now()}`;
    const orderInfo = `Thanh toan tien coc phong ${booking.room.title}`;

    // Tạo transaction record
    await this.paymentService.createTransaction(
      dto.bookingId,
      req.user.id,
      dto.amount,
      orderId,
      orderInfo,
    );

    // Tạo payment URL
    const paymentUrl = await this.paymentService.createVnpayPaymentUrl({
      amount: dto.amount,
      orderId,
      orderInfo,
      bankCode: dto.bankCode,
      language: dto.language || 'vn',
      ipAddr,
    });

    return {
      success: true,
      paymentUrl,
      message: 'Tạo URL thanh toán thành công',
    };
  }

  /**
   * VNPay Return URL - Người dùng được redirect về đây sau khi thanh toán
   */
  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any) {
    console.log('=== VNPay Return Callback ===');
    console.log('Query params:', JSON.stringify(query, null, 2));
    
    const isValid = this.paymentService.verifyVnpayCallback(query);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (!isValid) {
      console.error('❌ Invalid signature');
      return {
        success: false,
        message: 'Invalid signature',
        redirectUrl: `${frontendUrl}/dashboard/bookings?payment=failed`,
      };
    }

    const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo } = query;
    console.log('✅ Valid callback - ResponseCode:', vnp_ResponseCode);
    console.log('vnp_TxnRef:', vnp_TxnRef);
    console.log('vnp_TransactionNo:', vnp_TransactionNo);

    if (vnp_ResponseCode === '00') {
      // Thanh toán thành công
      try {
        await this.paymentService.processSuccessfulPayment(vnp_TxnRef, vnp_TransactionNo);
        console.log('✅ Payment processed successfully');
        // Redirect về frontend với success
        return `
          <html>
            <head>
              <title>Thanh toán thành công</title>
              <meta http-equiv="refresh" content="0; url=${frontendUrl}/dashboard/bookings?payment=success">
            </head>
            <body>
              <p>Đang chuyển hướng...</p>
            </body>
          </html>
        `;
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        return `
          <html>
            <head>
              <title>Lỗi xử lý</title>
              <meta http-equiv="refresh" content="0; url=${frontendUrl}/dashboard/bookings?payment=error">
            </head>
            <body>
              <p>Đang chuyển hướng...</p>
            </body>
          </html>
        `;
      }
    } else {
      // Thanh toán thất bại
      try {
        await this.paymentService.updateTransactionStatus(
          vnp_TxnRef,
          TransactionStatus.FAILED,
        );
      } catch (error) {
        // Log error nhưng vẫn redirect
      }

      return `
        <html>
          <head>
            <title>Thanh toán thất bại</title>
            <meta http-equiv="refresh" content="0; url=${frontendUrl}/dashboard/bookings?payment=failed">
          </head>
          <body>
            <p>Đang chuyển hướng...</p>
          </body>
        </html>
      `;
    }
  }

  /**
   * VNPay IPN (Instant Payment Notification) - Webhook từ VNPay
   */
  @Get('vnpay-ipn')
  async vnpayIpn(@Query() query: any) {
    console.log('=== VNPay IPN Callback ===');
    console.log('Query params:', JSON.stringify(query, null, 2));
    
    const isValid = this.paymentService.verifyVnpayCallback(query);

    if (!isValid) {
      console.error('❌ Invalid IPN signature');
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo } = query;
    console.log('✅ Valid IPN - ResponseCode:', vnp_ResponseCode);
    console.log('vnp_TxnRef:', vnp_TxnRef);
    console.log('vnp_TransactionNo:', vnp_TransactionNo);

    if (vnp_ResponseCode === '00') {
      try {
        await this.paymentService.processSuccessfulPayment(vnp_TxnRef, vnp_TransactionNo);
        console.log('✅ IPN payment processed successfully');
        return { RspCode: '00', Message: 'Success' };
      } catch (error) {
        console.error('❌ IPN error:', error);
        return { RspCode: '99', Message: 'Unknown error' };
      }
    } else {
      console.log('⚠️ Payment failed with code:', vnp_ResponseCode);
      try {
        await this.paymentService.updateTransactionStatus(
          vnp_TxnRef,
          TransactionStatus.FAILED,
        );
        return { RspCode: '00', Message: 'Success' };
      } catch (error) {
        return { RspCode: '99', Message: 'Unknown error' };
      }
    }
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(@Query() filter: TransactionFilterDto, @Req() req: any) {
    const transactions = await this.paymentService.getTransactions(
      req.user.id,
      filter,
    );
    return {
      success: true,
      message: 'Lấy danh sách giao dịch thành công',
      data: transactions,
    };
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnpayService } from './gateways/vnpay.service';
import { Transaction } from './entities/transaction.entity';
import { BookingModule } from '../booking/booking.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Transaction]),
    BookingModule,
    AuthModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, VnpayService],
  exports: [PaymentService],
})
export class PaymentModule {}

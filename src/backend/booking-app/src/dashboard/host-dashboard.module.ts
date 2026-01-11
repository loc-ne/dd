import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostDashboardService } from './host-dashboard.service';
import { HostDashboardController } from './host-dashboard.controller';
import { Transaction } from '../payment/entities/transaction.entity';
import { Booking } from '../booking/entities/booking.entity';
import { Room } from '../room/entities/room.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Booking, Room]),
    AuthModule,
  ],
  controllers: [HostDashboardController],
  providers: [HostDashboardService],
  exports: [HostDashboardService],
})
export class HostDashboardModule {}
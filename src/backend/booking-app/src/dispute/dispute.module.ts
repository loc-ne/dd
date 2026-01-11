import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from './entities/dispute.entity';
import { Booking } from '../booking/entities/booking.entity';
import { User } from '../user/user.entity';
import { PaymentModule } from '../payment/payment.module';
import { MailModule } from '../mail/mail.module';
import { Room } from '../room/entities/room.entity';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispute, Booking, User, Room]),
    PaymentModule,
    MailModule,
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
})
export class DisputeModule {}

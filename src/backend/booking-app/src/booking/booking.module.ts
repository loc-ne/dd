import { forwardRef, Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { Booking } from './entities/booking.entity';
import { User } from '../user/user.entity';
import { Room } from '../room/entities/room.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Room]),
    forwardRef(() => AuthModule),
    MailModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}

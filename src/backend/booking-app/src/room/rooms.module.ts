import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Room } from './entities/room.entity';
import { RoomImage } from './entities/room-image.entity'; 
import { RoomAmenity } from './entities/room-amenity.entity';
import { Amenity } from './entities/amenity.entity'; 
import { User } from '../user/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room, 
      RoomImage, 
      RoomAmenity,
      Amenity,
      User,
    ]),
    CloudinaryModule,
    AuthModule,
    MailModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, CloudinaryService],
  exports: [TypeOrmModule, RoomsService], 
})
export class RoomsModule {}
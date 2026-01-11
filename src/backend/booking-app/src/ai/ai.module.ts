import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Room } from '../room/entities/room.entity';
import { Review } from '../review/entities/review.entity';
import { UserReview } from '../user-review/user-review.entity';
import { User } from '../user/user.entity';
import { RoomImage } from '../room/entities/room-image.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Room, Review, UserReview, User, RoomImage]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
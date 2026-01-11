import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './user.controller';
import { User } from './user.entity';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    CloudinaryModule,
  ],
  providers: [UsersService],
  controllers: [UsersController], 
  exports: [UsersService],
})
export class UsersModule {}

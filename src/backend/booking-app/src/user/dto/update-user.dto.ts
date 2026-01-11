// src/users/dto/update-user.dto.ts

import { 
  IsOptional, 
  IsString, 
  IsPhoneNumber, 
  IsNotEmpty, 
  Length,
  ValidateIf
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống nếu gửi lên' })
  @Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' })
  fullName?: string;

  @IsOptional()
  @ValidateIf((obj) => obj.phoneNumber !== '')
  @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng Việt Nam' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
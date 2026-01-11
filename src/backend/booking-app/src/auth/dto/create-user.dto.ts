import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthProvider } from '../../user/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  passwordHash?: string; // Sẽ là null nếu đăng nhập bằng Google

  @IsString()
  @IsOptional()
  googleId?: string; // Sẽ là null nếu đăng ký local

  @IsOptional()
  authProvider?: AuthProvider;
}
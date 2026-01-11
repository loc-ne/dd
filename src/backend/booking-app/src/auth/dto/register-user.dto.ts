import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { AuthProvider } from 'src/user/user.entity';
export class RegisterUserDto {
  //Tên: Không được để trống, kiểu chuỗi, độ dài tối thiểu 2 ký tự
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  fullName: string;

  //Email: Không được để trống, phải đúng định dạng email
  @IsNotEmpty()
  @IsEmail()
  email: string;

  //Mật khẩu: Không được để trống, kiểu chuỗi, độ dài tối thiểu 6 ký tự
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least and one number',
  })
  password: string;

  //Đăng nhập trên Google
  @IsOptional()
  authProvider?: AuthProvider = AuthProvider.LOCAL;
}

import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @Matches(/^(?=.*[0-9])/, {
    message: 'Mật khẩu mới phải chứa ít nhất một chữ số',
  })
  newPassword: string;
}

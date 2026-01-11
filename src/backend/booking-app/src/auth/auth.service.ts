import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, AuthProvider } from '../user/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from '../user/users.service';
import { MailService } from '../mail/mail.service';

import axios from 'axios';

async function downloadAvatar(url: string): Promise<string | null> {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    // upload lên S3 / Cloudinary / local static
    return res.data[0];
  } catch {
    return null;
  }
}


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) { }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      isHost: user.isHost,
      isAdmin: user.isAdmin,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  generateEmailToken(userId: string) {
    return this.jwtService.sign({ userId }, { expiresIn: '24h' });
  }

  async sendVerificationEmail(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    if (user.isActive) {
      return { message: 'Email của bạn đã được xác thực rồi' };
    }
    // tạo token 24h
    const token = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: '24h' },
    );
    await this.mailService.sendUserConfirmation(user, token);
    return { message: 'Email xác thực đã được gửi' };
  }

  async verifyEmail(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      await this.usersService.updateEmailVerified(decoded.userId);

      return { success: true, message: 'Xác thực email thành công!' };
    } catch (e) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn!');
    }
  }

  async register(registerDto: RegisterUserDto) {
    const { email, fullName, password } = registerDto;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email exists');
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const user = this.usersRepository.create({
      email,
      fullName,
      passwordHash,
      authProvider: AuthProvider.LOCAL,
      isActive: false,
    });

    await this.usersRepository.save(user);

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
      },
      ...tokens, // access_token, refresh_token
    };
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    // Kiểm tra tài khoản có bị khóa không
    if (user.lockReason) {
      throw new UnauthorizedException(`Tài khoản đã bị khóa. Lý do: ${user.lockReason}`);
    }

    const tokens = await this.generateTokens(user);

    // Trả về đầy đủ thông tin user (loại bỏ passwordHash)
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
      },
      ...tokens,
    };
  }

  async refresh(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('User not found');

    const newToken = await this.generateTokens(user);
    return newToken;
  }

  async me(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      // Không thông báo user không tồn tại để tránh lộ thông tin
      return { message: 'Nếu email tồn tại, link reset password đã được gửi' };
    }

    // Tạo token reset password với thời hạn 1 giờ
    const resetToken = this.jwtService.sign(
      { userId: user.id, type: 'reset_password' },
      { expiresIn: '1h' },
    );

    // Gửi email chứa link reset password
    await this.mailService.sendPasswordReset(user, resetToken);

    return { message: 'Nếu email tồn tại, link reset password đã được gửi' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);

      if (decoded.type !== 'reset_password') {
        throw new BadRequestException('Token không hợp lệ');
      }

      const user = await this.usersRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new NotFoundException('User không tồn tại');
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.passwordHash = hashedPassword;
      await this.usersRepository.save(user);

      return { message: 'Đổi mật khẩu thành công' };
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new BadRequestException('Token đã hết hạn');
      }
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl: string;
  }) {

    let user = await this.usersRepository.findOne({
      where: { googleId: googleUser.googleId },
    });


    if (!user) {
      user = await this.usersRepository.findOne({
        where: {
          email: googleUser.email
        },
      });
    }

    if (!user) {
      user = this.usersRepository.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        avatarUrl: googleUser.avatarUrl ?? await downloadAvatar(googleUser.avatarUrl),
        googleId: googleUser.googleId,
        authProvider: AuthProvider.GOOGLE,
        isActive: false, // Vẫn phải xác thực số điện thoại thông qua
      });
      await this.usersRepository.save(user);
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.lockReason) {
      throw new UnauthorizedException(`Tài khoản đã bị khóa. Lý do: ${user.lockReason}`);
    }

    if (user.authProvider === AuthProvider.LOCAL && !user.googleId) {
      user.googleId = googleUser.googleId;
      user.authProvider = AuthProvider.GOOGLE;
      user.avatarUrl ??= googleUser.avatarUrl;
      await this.usersRepository.save(user);
    }

    const tokens = await this.generateTokens(user);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user,
    };
  }

}
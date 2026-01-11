import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private getCookieSettings() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
    };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    const cookieSettings = this.getCookieSettings();

    res.cookie('access_token', result.access_token, {
      ...cookieSettings,
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refresh_token, {
      ...cookieSettings,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Register successfully',
      data: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    const cookieSettings = this.getCookieSettings();

    res.cookie('access_token', result.access_token, {
      ...cookieSettings,
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refresh_token, {
      ...cookieSettings,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Login successfully',
      data: result.user,
    };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const userId = req['payload'].sub;

    const token = await this.authService.refresh(userId);

    const cookieSettings = this.getCookieSettings();

    res.cookie('access_token', token.access_token, {
      ...cookieSettings,
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', token.refresh_token, {
      ...cookieSettings,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Refresh successfully',
      data: token,
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async me(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const userId = req['payload'].sub;


    const user = await this.authService.me(userId);
    console.log(user);
    return {
      success: true,
      message: 'Get user successfully',
      data: user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const cookieSettings = this.getCookieSettings();
    
    // Clear cookies with the same options used to set them
    res.clearCookie('access_token', cookieSettings);
    res.clearCookie('refresh_token', cookieSettings);
    
    return {
      success: true,
      message: 'Logout successfully',
      data: null,
    };
  }

  @Post('send-verification-email')
  @UseGuards(JwtAuthGuard)
  async sendVerification(@Req() req) {
    const userId = req.user.id;
    return this.authService.sendVerificationEmail(userId);
  }


  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  //Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    
  }


  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    const { access_token, refresh_token } = await this.authService.googleLogin(req.user);
    
    const cookieSettings = this.getCookieSettings();

    res.cookie('access_token', access_token, {
      ...cookieSettings,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refresh_token', refresh_token, {
      ...cookieSettings,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.redirect(`${process.env.FRONTEND_URL}`);
  }

}

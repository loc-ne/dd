import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
      
      req['user'] = {
        id: payload.sub,
        email: payload.email,
        isHost: payload.isHost,
        isAdmin: payload.isAdmin,
      };
      
      req['payload'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'Refresh token has been expired or invalid',
      );
    }
  }
}
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://introduction-se.onrender.com/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

async validate(
  accessToken: string,
  refreshToken: string,
  profile: Profile,
) {
  return {
    googleId: profile.id,
    email: profile.emails?.[0]?.value || '',
    fullName: profile.displayName,
    avatarUrl: profile.photos?.[0]?.value,
  };
}

}

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    const clientId = configService.get<string>('google.clientId');
    const clientSecret = configService.get<string>('google.clientSecret');
    const callbackURL = GoogleStrategy.getCallbackURL(configService);

    // Always call super first, use dummy values if credentials are not configured
    super({
      clientID: clientId || 'dummy',
      clientSecret: clientSecret || 'dummy',
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
    });

    if (!clientId || !clientSecret) {
      this.logger.warn(
        'Google OAuth credentials not configured. Google login will not be available.',
      );
    } else {
      this.logger.log('Google OAuth strategy initialized');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName, photos } = profile;
    const user = {
      email: emails[0].value,
      name: displayName,
      picture: photos[0]?.value,
      provider: 'google',
    };
    done(null, user);
  }

  private static getCallbackURL(configService: ConfigService): string {
    // Check if explicitly configured
    const configuredUrl = configService.get<string>('google.callbackURL');
    if (configuredUrl && configuredUrl !== '') {
      return configuredUrl;
    }

    // For development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000/auth/google/callback';
    }

    // For production, should be configured via environment
    return 'http://localhost:3000/auth/google/callback';
  }
}

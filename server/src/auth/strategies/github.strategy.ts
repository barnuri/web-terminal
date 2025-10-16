import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(private configService: ConfigService) {
    const clientId = configService.get<string>('github.clientId');
    const clientSecret = configService.get<string>('github.clientSecret');
    const callbackURL = GitHubStrategy.getCallbackURL(configService);

    // Always call super first, use dummy values if credentials are not configured
    super({
      clientID: clientId || 'dummy',
      clientSecret: clientSecret || 'dummy',
      callbackURL: callbackURL,
      scope: ['user:email'],
    });

    if (!clientId || !clientSecret) {
      this.logger.warn(
        'GitHub OAuth credentials not configured. GitHub login will not be available.',
      );
    } else {
      this.logger.log('GitHub OAuth strategy initialized');
    }
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { emails, displayName, photos, username } = profile;
    const user = {
      email: emails[0].value,
      name: displayName || username,
      picture: photos[0]?.value,
      provider: 'github',
    };
    return user;
  }

  private static getCallbackURL(configService: ConfigService): string {
    // Check if explicitly configured
    const configuredUrl = configService.get<string>('github.callbackURL');
    if (configuredUrl && configuredUrl !== '') {
      return configuredUrl;
    }

    // For development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000/auth/github/callback';
    }

    // For production, should be configured via environment
    return 'http://localhost:3000/auth/github/callback';
  }
}

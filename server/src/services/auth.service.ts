import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleOAuthCallback(user: any): Promise<string> {
    this.logger.log(`OAuth callback received for user: ${JSON.stringify(user, null, 2)}`);

    if (!user) {
      this.logger.error('No user received from OAuth provider');
      throw new Error('No user data received from OAuth provider');
    }

    if (!user.email) {
      this.logger.error('No email received from OAuth provider');
      throw new Error('No email received from OAuth provider');
    }

    // Check if auth is enabled
    const authEnabled = this.configService.get<boolean>('auth.enabled');
    if (!authEnabled) {
      this.logger.warn('Authentication attempt but AUTH_ENABLE is false');
      throw new Error('Authentication is disabled');
    }

    // Validate email against allowlist (only for OAuth providers, not static secret)
    const allowedEmails = this.configService.get<string[]>('auth.allowedEmails');
    this.logger.log(`Allowed emails: ${JSON.stringify(allowedEmails)}`);

    if (!allowedEmails || allowedEmails.length === 0) {
      this.logger.error('AUTH_ALLOWED_EMAILS is not configured');
      throw new Error('Email allowlist is not configured');
    }

    if (!allowedEmails.includes(user.email)) {
      this.logger.warn(
        `Unauthorized login attempt by ${user.email}. Allowed emails: ${allowedEmails.join(', ')}`,
      );
      throw new ForbiddenException(`Email ${user.email} is not in the allowed list`);
    }

    // Generate JWT
    const payload: JwtPayload = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
    };

    const token = this.jwtService.sign(payload);
    this.logger.log(`JWT token generated for ${user.email} from ${user.provider}`);
    return token;
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async handleStaticSecretAuth(secret: string): Promise<string> {
    this.logger.log('Static secret authentication attempt');

    // Check if auth is enabled
    const authEnabled = this.configService.get<boolean>('auth.enabled');
    if (!authEnabled) {
      this.logger.warn('Authentication attempt but AUTH_ENABLE is false');
      throw new Error('Authentication is disabled');
    }

    // Get configured static secret
    const configuredSecret = this.configService.get<string>('auth.staticSecret');
    if (!configuredSecret) {
      this.logger.error('Static secret authentication not configured');
      throw new UnauthorizedException('Static secret authentication is not configured');
    }

    // Verify the secret
    if (secret !== configuredSecret) {
      this.logger.warn('Invalid static secret provided');
      throw new UnauthorizedException('Invalid secret');
    }

    // Generate JWT for static secret auth
    const payload: JwtPayload = {
      email: 'static-secret-user',
      name: 'Static Secret User',
      provider: 'static-secret',
    };

    const token = this.jwtService.sign(payload);
    this.logger.log('JWT token generated for static secret authentication');
    return token;
  }

  isStaticSecretConfigured(): boolean {
    const staticSecret = this.configService.get<string>('auth.staticSecret');
    return !!(staticSecret && staticSecret.trim().length > 0);
  }

  validateEmail(email: string): boolean {
    const authEnabled = this.configService.get<boolean>('auth.enabled');
    if (!authEnabled) return true;

    const allowedEmails = this.configService.get<string[]>('auth.allowedEmails');
    return allowedEmails?.includes(email) || false;
  }
}

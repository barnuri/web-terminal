import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../services';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalAuthGuard.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authEnabled = this.configService.get<boolean>('auth.enabled');

    // If auth is disabled, allow all requests (no user set)
    if (!authEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If no auth header, continue without user (don't throw error)
    if (!authHeader) {
      return true;
    }

    const [type, token] = authHeader.split(' ');

    // If invalid format, continue without user (don't throw error)
    if (type !== 'Bearer' || !token) {
      return true;
    }

    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      return true;
    } catch (error) {
      // Token is invalid/expired, but we don't throw - just continue without user
      this.logger.warn(`Optional auth failed: ${error.message}`);
      return true;
    }
  }
}

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { AuthService } from '../../services';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authEnabled = this.configService.get<boolean>('auth.enabled');

    // If auth is disabled, allow all connections
    if (!authEnabled) {
      return true;
    }

    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.warn(`Client ${client.id} attempted connection without token`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return false;
    }

    try {
      const user = await this.authService.verifyToken(token);
      client.data.user = user;
      this.logger.log(`Client ${client.id} authenticated as ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
      return false;
    }
  }
}

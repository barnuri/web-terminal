import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService, UrlService } from '../services';
import { AuthController } from '../controllers';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('session.secret'),
        signOptions: {
          expiresIn: '7d',
          issuer: 'web-terminal',
          audience: 'web-terminal-client',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    UrlService,
    GoogleStrategy,
    GitHubStrategy,
    JwtAuthGuard,
    WsAuthGuard,
    OptionalAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, UrlService, JwtAuthGuard, WsAuthGuard, OptionalAuthGuard],
})
export class AuthModule {}

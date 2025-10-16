import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService, UrlService } from '../services';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private urlService: UrlService,
  ) {}

  private isGoogleConfigured(): boolean {
    const googleClientId = this.configService.get<string>('google.clientId');
    const googleClientSecret = this.configService.get<string>('google.clientSecret');
    return !!(googleClientId && googleClientSecret);
  }

  private isGitHubConfigured(): boolean {
    const githubClientId = this.configService.get<string>('github.clientId');
    const githubClientSecret = this.configService.get<string>('github.clientSecret');
    return !!(githubClientId && githubClientSecret);
  }

  private isStaticSecretConfigured(): boolean {
    return this.authService.isStaticSecretConfigured();
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    if (!this.isGoogleConfigured()) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    try {
      const token = await this.authService.handleOAuthCallback(req.user);
      const frontendUrl = this.getFrontendUrl(req);
      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      this.logger.error(`Google OAuth callback failed: ${error.message}`);
      const frontendUrl = this.getFrontendUrl(req);
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Static Secret Auth
  @Post('static-secret')
  async staticSecretLogin(@Body() body: { secret: string }, @Res() res: Response) {
    try {
      if (!this.isStaticSecretConfigured()) {
        throw new BadRequestException('Static secret authentication is not configured');
      }

      const { secret } = body;
      if (!secret) {
        throw new BadRequestException('Secret is required');
      }

      const token = await this.authService.handleStaticSecretAuth(secret);
      res.json({ token, message: 'Authentication successful' });
    } catch (error) {
      this.logger.error(`Static secret authentication failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    if (!this.isGitHubConfigured()) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }
    // Redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      const token = await this.authService.handleOAuthCallback(req.user);
      const frontendUrl = this.getFrontendUrl(req);
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      this.logger.error(`GitHub OAuth callback failed: ${error.message}`);
      const frontendUrl = this.getFrontendUrl(req);
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('providers')
  getProviders() {
    return {
      google: this.isGoogleConfigured(),
      github: this.isGitHubConfigured(),
      staticSecret: this.isStaticSecretConfigured(),
    };
  }

  @Get('status')
  getStatus(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // Prevent caching to avoid 304 responses
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const authEnabled = this.configService.get<boolean>('auth.enabled');
    return {
      authEnabled,
      authenticated: !!req.user,
      user: req.user || null,
      availableProviders: {
        google: this.isGoogleConfigured(),
        github: this.isGitHubConfigured(),
        staticSecret: this.isStaticSecretConfigured(),
      },
    };
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.json({ message: 'Logged out successfully' });
  }

  private getFrontendUrl(req: any): string {
    // First, check if we have a stored ngrok URL
    const ngrokUrl = this.urlService.getNgrokUrl();
    if (ngrokUrl) {
      this.logger.log(`Using stored ngrok URL: ${ngrokUrl}`);
      return ngrokUrl;
    }

    // Otherwise, determine from the request
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const host = req.get('x-forwarded-host') || req.get('host');
    const frontendUrl = `${protocol}://${host}`;
    this.logger.log(`Using request-based URL: ${frontendUrl}`);
    return frontendUrl;
  }
}

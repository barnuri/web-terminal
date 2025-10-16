import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  private ignoreRoutes = ['/assets', '/favicon.ico', '/health'];

  private shouldIgnore(url: string): boolean {
    return this.ignoreRoutes.some((route) => url.startsWith(route));
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;

    // Skip logging for ignored routes
    if (this.shouldIgnore(originalUrl)) {
      next();
      return;
    }

    // const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('Content-Length');
      const responseTime = Date.now() - startTime;

      const logMessage = `method=${method}, url=${originalUrl}, statusCode=${statusCode}, contentLength=${contentLength || 0}b, responseTime=${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}

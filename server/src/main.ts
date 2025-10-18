require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import ngrok from '@ngrok/ngrok';
import { UrlService } from './services';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;
  const nodeEnv = configService.get<string>('nodeEnv');

  // Enable CORS with all headers allowed
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    allowedHeaders: '*', // Allow all headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port);

  // Get the UrlService instance to store ngrok URL
  const urlService = app.get(UrlService);

  if (process.env.NGROK_AUTHTOKEN) {
    ngrok.connect({ addr: port, authtoken: process.env.NGROK_AUTHTOKEN }).then((listener) => {
      const ngrokUrl = listener.url();
      console.log(`Ingress established at: ${ngrokUrl}`);
      // Store the ngrok URL in the shared service
      if (ngrokUrl) {
        urlService.setNgrokUrl(ngrokUrl);
      }
    });
  } else {
    logger.warn('NGROK_AUTHTOKEN is not set. Skipping ngrok setup.');
  }

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`Terminal shell: ${configService.get('terminal.shell')}`);
  logger.log(`Allowed path: ${configService.get('terminal.allowedPath')}`);
}

bootstrap();

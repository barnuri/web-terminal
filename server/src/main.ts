require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import ngrok from '@ngrok/ngrok';

async function bootstrap() {
  const envPath = path.resolve(__dirname, '../.env');
  const envExamplePath = path.resolve(__dirname, '../.env.example');

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }

  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;
  const nodeEnv = configService.get<string>('nodeEnv');
  const corsOrigin = configService.get<string>('cors.origin');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS for development
  if (nodeEnv === 'development') {
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
    });
    logger.log(`CORS enabled for origin: ${corsOrigin}`);
  }

  await app.listen(port);
  if (process.env.NGROK_AUTHTOKEN) {
    ngrok
      .connect({ addr: port, authtoken: process.env.NGROK_AUTHTOKEN })
      .then((listener) => console.log(`Ingress established at: ${listener.url()}`));
  } else {
    logger.warn('NGROK_AUTHTOKEN is not set. Skipping ngrok setup.');
  }

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`Terminal shell: ${configService.get('terminal.shell')}`);
  logger.log(`Allowed path: ${configService.get('terminal.allowedPath')}`);
}

bootstrap();

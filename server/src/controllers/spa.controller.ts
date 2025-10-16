import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class SpaController {
  @Get(['/', '/login', '/auth/callback'])
  serveSpa(@Res() res: Response): void {
    const indexPath = join(__dirname, '..', '..', '..', 'client', 'dist', 'index.html');
    res.sendFile(indexPath);
  }
}

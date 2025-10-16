import { Module } from '@nestjs/common';
import { TerminalGateway } from '../gateways';
import { TerminalService } from '../services';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TerminalGateway, TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}

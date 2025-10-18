import { Module } from '@nestjs/common';
import { TerminalGateway } from '../gateways';
import { TerminalService } from '../services';
import { TerminalController } from '../controllers';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TerminalController],
  providers: [TerminalGateway, TerminalService],
  exports: [TerminalService],
})
export class TerminalModule {}

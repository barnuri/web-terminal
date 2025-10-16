import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { TerminalService } from '../services';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('api/terminal')
export class TerminalController {
  private readonly logger = new Logger(TerminalController.name);

  constructor(private terminalService: TerminalService) {}

  @Get('folder-shortcuts')
  @UseGuards(OptionalAuthGuard)
  getFolderShortcuts() {
    try {
      const shortcuts = this.terminalService.getFolderShortcuts();
      this.logger.debug(`Returned ${shortcuts.length} folder shortcuts`);
      return { shortcuts };
    } catch (error) {
      this.logger.error(`Failed to get folder shortcuts: ${error.message}`);
      throw error;
    }
  }

  @Get('favorite-commands')
  @UseGuards(OptionalAuthGuard)
  getFavoriteCommands() {
    try {
      const commands = this.terminalService.getFavoriteCommands();
      this.logger.debug(`Returned ${commands.length} favorite commands`);
      return { commands };
    } catch (error) {
      this.logger.error(`Failed to get favorite commands: ${error.message}`);
      throw error;
    }
  }
}

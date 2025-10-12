import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pty from 'node-pty';
import { IPty } from 'node-pty';
import * as os from 'os';
import * as path from 'path';

interface TerminalSession {
  pty: IPty;
  clientId: string;
  createdAt: Date;
}

@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);
  private sessions: Map<string, TerminalSession> = new Map();

  constructor(private configService: ConfigService) {}

  createSession(
    sessionId: string,
    clientId: string,
    onData: (data: string) => void,
    onExit: () => void,
  ): void {
    try {
      const shell = this.configService.get<string>('terminal.shell')!;
      const allowedPath = this.configService.get<string>('terminal.allowedPath')!;

      // Validate and normalize the allowed path
      const cwd = this.validatePath(allowedPath);

      this.logger.log(`Creating terminal session ${sessionId} for client ${clientId}`);
      this.logger.debug(`Shell: ${shell}, CWD: ${cwd}`);

      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      });

      ptyProcess.onData((data) => {
        onData(data);
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        this.logger.log(
          `Terminal session ${sessionId} exited with code ${exitCode}, signal ${signal}`,
        );
        this.sessions.delete(sessionId);
        onExit();
      });

      this.sessions.set(sessionId, {
        pty: ptyProcess,
        clientId,
        createdAt: new Date(),
      });

      this.logger.log(`Terminal session ${sessionId} created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create terminal session: ${error.message}`, error.stack);
      throw error;
    }
  }

  writeToSession(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Attempted to write to non-existent session: ${sessionId}`);
      return;
    }

    try {
      session.pty.write(data);
    } catch (error) {
      this.logger.error(`Failed to write to session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  resizeSession(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Attempted to resize non-existent session: ${sessionId}`);
      return;
    }

    try {
      session.pty.resize(cols, rows);
      this.logger.debug(`Resized session ${sessionId} to ${cols}x${rows}`);
    } catch (error) {
      this.logger.error(`Failed to resize session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Attempted to destroy non-existent session: ${sessionId}`);
      return;
    }

    try {
      session.pty.kill();
      this.sessions.delete(sessionId);
      this.logger.log(`Terminal session ${sessionId} destroyed`);
    } catch (error) {
      this.logger.error(`Failed to destroy session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Map<string, TerminalSession> {
    return this.sessions;
  }

  private validatePath(allowedPath: string): string {
    try {
      // Resolve and normalize the path
      const resolvedPath = path.resolve(allowedPath);

      // Check if path exists and is accessible
      const fs = require('fs');
      if (!fs.existsSync(resolvedPath)) {
        this.logger.warn(`Allowed path does not exist: ${resolvedPath}, using home directory`);
        return os.homedir();
      }

      return resolvedPath;
    } catch (error) {
      this.logger.error(`Path validation failed: ${error.message}, using home directory`);
      return os.homedir();
    }
  }

  onModuleDestroy() {
    // Clean up all sessions on module destruction
    this.logger.log('Cleaning up all terminal sessions');
    for (const [sessionId, session] of this.sessions.entries()) {
      try {
        session.pty.kill();
      } catch (error) {
        this.logger.error(`Error killing session ${sessionId}: ${error.message}`);
      }
    }
    this.sessions.clear();
  }
}

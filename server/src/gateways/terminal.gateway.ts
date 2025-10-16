import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TerminalService } from '../services/terminal.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

interface CreateSessionPayload {
  sessionId: string;
  cwd?: string;
}

interface ResizePayload {
  sessionId: string;
  cols: number;
  rows: number;
}

interface InputPayload {
  sessionId: string;
  data: string;
}

@WebSocketGateway({
  cors: {
    origin: (_origin, callback) => {
      // In development, allow configured origin
      // In production, implement proper origin validation
      callback(null, true);
    },
    credentials: true,
    allowedHeaders: '*', // Allow all headers
    methods: ['GET', 'POST'],
  },
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private clientSessions: Map<string, Set<string>> = new Map(); // clientId -> Set of sessionIds

  constructor(
    private terminalService: TerminalService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const authEnabled = this.configService.get<boolean>('auth.enabled');

    if (authEnabled) {
      try {
        const token = client.handshake.auth.token;
        if (!token) {
          this.logger.warn(`Client ${client.id} connected without token`);
          client.emit('error', { message: 'Authentication required' });
          client.disconnect();
          return;
        }

        // Verify token
        const user = await this.authService.verifyToken(token);

        // Attach user to socket
        client.data.user = user;

        this.logger.log(`Client ${client.id} authenticated as ${user.email}`);
      } catch (error) {
        this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
        client.emit('error', { message: 'Authentication failed' });
        client.disconnect();
        return;
      }
    }

    this.logger.log(`Client connected: ${client.id}`);
    this.clientSessions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Update session access time instead of destroying
    // Sessions will be cleaned up by timeout mechanism
    const sessions = this.clientSessions.get(client.id);
    if (sessions) {
      sessions.forEach((sessionId) => {
        this.logger.log(
          `Client ${client.id} disconnected, session ${sessionId} will persist until timeout`,
        );
        this.terminalService.updateSessionAccess(sessionId);
      });
      this.clientSessions.delete(client.id);
    }
  }

  @SubscribeMessage('create-session')
  handleCreateSession(
    @MessageBody() payload: CreateSessionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, cwd } = payload;

    if (!sessionId) {
      this.logger.error('Session ID is required');
      client.emit('error', { message: 'Session ID is required' });
      return;
    }

    try {
      // Check if session already exists
      if (this.terminalService.getSession(sessionId)) {
        this.logger.warn(`Session ${sessionId} already exists`);
        client.emit('error', { message: 'Session already exists' });
        return;
      }

      // Create the terminal session with optional custom cwd
      this.terminalService.createSession(
        sessionId,
        client.id,
        (data: string) => {
          // Send output to client
          client.emit('output', { sessionId, data });
        },
        () => {
          // Handle terminal exit
          client.emit('session-closed', { sessionId });

          // Remove from client's session list
          const sessions = this.clientSessions.get(client.id);
          if (sessions) {
            sessions.delete(sessionId);
          }
        },
        cwd,
      );

      // Add to client's session list
      const sessions = this.clientSessions.get(client.id);
      if (sessions) {
        sessions.add(sessionId);
      }

      // Confirm session creation
      client.emit('session-created', { sessionId });
      this.logger.log(`Session ${sessionId} created for client ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`, error.stack);
      client.emit('error', {
        sessionId,
        message: 'Failed to create terminal session',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('input')
  handleInput(@MessageBody() payload: InputPayload, @ConnectedSocket() client: Socket) {
    const { sessionId, data } = payload;

    if (!sessionId || data === undefined) {
      this.logger.error('Session ID and data are required for input');
      return;
    }

    try {
      this.terminalService.writeToSession(sessionId, data);
    } catch (error) {
      this.logger.error(`Failed to process input for session ${sessionId}: ${error.message}`);
      client.emit('error', {
        sessionId,
        message: 'Failed to process input',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('resize')
  handleResize(@MessageBody() payload: ResizePayload, @ConnectedSocket() client: Socket) {
    const { sessionId, cols, rows } = payload;

    if (!sessionId || !cols || !rows) {
      this.logger.error('Session ID, cols, and rows are required for resize');
      return;
    }

    try {
      // Verify the session belongs to this client
      const sessions = this.clientSessions.get(client.id);
      if (!sessions || !sessions.has(sessionId)) {
        this.logger.warn(
          `Client ${client.id} attempted to resize unauthorized session ${sessionId}`,
        );
        return;
      }

      this.terminalService.resizeSession(sessionId, cols, rows);
    } catch (error) {
      this.logger.error(`Failed to resize session ${sessionId}: ${error.message}`);
      client.emit('error', {
        sessionId,
        message: 'Failed to resize terminal',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('destroy-session')
  handleDestroySession(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = payload;

    if (!sessionId) {
      this.logger.error('Session ID is required for destroy');
      return;
    }

    try {
      // Verify the session belongs to this client
      const sessions = this.clientSessions.get(client.id);
      if (!sessions || !sessions.has(sessionId)) {
        this.logger.warn(
          `Client ${client.id} attempted to destroy unauthorized session ${sessionId}`,
        );
        return;
      }

      this.terminalService.destroySession(sessionId);
      sessions.delete(sessionId);

      client.emit('session-destroyed', { sessionId });
      this.logger.log(`Session ${sessionId} destroyed by client ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to destroy session ${sessionId}: ${error.message}`);
      client.emit('error', {
        sessionId,
        message: 'Failed to destroy session',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('get-folder-shortcuts')
  handleGetFolderShortcuts(@ConnectedSocket() client: Socket) {
    try {
      const shortcuts = this.terminalService.getFolderShortcuts();
      client.emit('folder-shortcuts', { shortcuts });
      this.logger.debug(`Sent ${shortcuts.length} folder shortcuts to client ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to get folder shortcuts: ${error.message}`);
      client.emit('error', {
        message: 'Failed to get folder shortcuts',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('get-favorite-commands')
  handleGetFavoriteCommands(@ConnectedSocket() client: Socket) {
    try {
      const commands = this.terminalService.getFavoriteCommands();
      client.emit('favorite-commands', { commands });
      this.logger.debug(`Sent ${commands.length} favorite commands to client ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to get favorite commands: ${error.message}`);
      client.emit('error', {
        message: 'Failed to get favorite commands',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('reconnect-session')
  handleReconnectSession(
    @MessageBody() payload: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = payload;

    if (!sessionId) {
      this.logger.error('Session ID is required for reconnect');
      client.emit('reconnect-failed', { message: 'Session ID is required' });
      return;
    }

    try {
      const session = this.terminalService.getSession(sessionId);

      if (!session) {
        this.logger.warn(`Session ${sessionId} not found for reconnect`);
        client.emit('reconnect-failed', { sessionId, message: 'Session not found or expired' });
        return;
      }

      // Update session access time
      this.terminalService.updateSessionAccess(sessionId);

      // Add to client's session list
      let sessions = this.clientSessions.get(client.id);
      if (!sessions) {
        sessions = new Set();
        this.clientSessions.set(client.id, sessions);
      }
      sessions.add(sessionId);

      // Reconnect output handler
      const originalPty = session.pty;
      originalPty.onData((data: string) => {
        client.emit('output', { sessionId, data });
      });

      client.emit('reconnect-success', { sessionId });
      this.logger.log(`Client ${client.id} reconnected to session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to reconnect session ${sessionId}: ${error.message}`);
      client.emit('reconnect-failed', {
        sessionId,
        message: 'Failed to reconnect to session',
        details: error.message,
      });
    }
  }
}

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
import { TerminalService } from './terminal.service';
import { ConfigService } from '@nestjs/config';

interface CreateSessionPayload {
  sessionId: string;
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
    origin: (origin, callback) => {
      // In development, allow configured origin
      // In production, implement proper origin validation
      callback(null, true);
    },
    credentials: true,
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
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSessions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up all sessions for this client
    const sessions = this.clientSessions.get(client.id);
    if (sessions) {
      sessions.forEach((sessionId) => {
        this.logger.log(`Destroying session ${sessionId} for disconnected client ${client.id}`);
        this.terminalService.destroySession(sessionId);
      });
      this.clientSessions.delete(client.id);
    }
  }

  @SubscribeMessage('create-session')
  handleCreateSession(
    @MessageBody() payload: CreateSessionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = payload;

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

      // Create the terminal session
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
      // Verify the session belongs to this client
      const sessions = this.clientSessions.get(client.id);
      if (!sessions || !sessions.has(sessionId)) {
        this.logger.warn(
          `Client ${client.id} attempted to write to unauthorized session ${sessionId}`,
        );
        client.emit('error', {
          sessionId,
          message: 'Unauthorized session access',
        });
        return;
      }

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
}

# Web Terminal - Authentication & Best Practices Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [OAuth Implementation](#oauth-implementation)
4. [Security Best Practices](#security-best-practices)
5. [WebSocket Authentication](#websocket-authentication)
6. [Session Management](#session-management)
7. [Mobile UI Patterns](#mobile-ui-patterns)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Checklist](#deployment-checklist)

---

## Overview

This document provides comprehensive guidance for implementing authentication, session management, and mobile-friendly UI patterns in the Web Terminal application. It leverages best practices from Context7, industry standards, and production-tested patterns.

### Key Technologies
- **Backend**: NestJS with Passport.js for OAuth
- **Frontend**: React with Context API for state management
- **Authentication**: OAuth 2.0 (Google & GitHub) + JWT
- **Terminal**: xterm.js with node-pty backend
- **WebSocket**: Socket.io for real-time communication

---

## Authentication Architecture

### Design Principles

1. **Optional by Design**: Authentication is disabled by default (`AUTH_ENABLE=false`)
2. **Stateless**: JWT tokens eliminate need for server-side sessions
3. **Provider Agnostic**: OAuth with Google and GitHub, extensible to others
4. **Email Allowlist**: Fine-grained access control via `AUTH_ALLOWED_EMAILS`
5. **WebSocket Compatible**: Token-based auth works with WebSocket handshake

### Authentication Flow

```
┌─────────┐                ┌──────────┐                ┌─────────────┐
│  User   │                │ Frontend │                │   Backend   │
└────┬────┘                └────┬─────┘                └──────┬──────┘
     │                          │                             │
     │  1. Click "Login"        │                             │
     ├─────────────────────────>│                             │
     │                          │  2. Redirect to OAuth       │
     │                          ├────────────────────────────>│
     │                          │                             │
     │  3. OAuth Provider Flow  │                             │
     │<─────────────────────────┼─────────────────────────────┤
     │                          │                             │
     │  4. Callback with code   │                             │
     ├─────────────────────────>│  5. Exchange code for token │
     │                          ├────────────────────────────>│
     │                          │                             │
     │                          │  6. Validate email          │
     │                          │  7. Generate JWT            │
     │                          │<────────────────────────────┤
     │                          │                             │
     │  8. Save token & redirect│                             │
     │<─────────────────────────┤                             │
     │                          │                             │
     │  9. Connect WebSocket    │                             │
     │  with JWT in handshake   │                             │
     ├─────────────────────────────────────────────────────────>│
     │                          │                             │
     │  10. Create terminal     │                             │
     │  session (authenticated) │                             │
     │<─────────────────────────────────────────────────────────┤
```

### Backend Components

#### 1. Auth Module Structure
```typescript
server/src/auth/
├── auth.module.ts           # Module definition
├── auth.controller.ts       # OAuth routes
├── auth.service.ts          # JWT & email validation
├── guards/
│   ├── auth.guard.ts        # HTTP request guard
│   └── ws-auth.guard.ts     # WebSocket guard
└── strategies/
    ├── google.strategy.ts   # Google OAuth
    └── github.strategy.ts   # GitHub OAuth
```

#### 2. Configuration Integration
The configuration already exists in `server/src/config/configuration.ts`:
```typescript
auth: {
  enabled: process.env.AUTH_ENABLE === 'true',
  allowedEmails: (process.env.AUTH_ALLOWED_EMAILS || '')
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0),
},
google: {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
github: {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackURL: process.env.GITHUB_CALLBACK_URL,
}
```

---

## OAuth Implementation

### Google OAuth Setup

#### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth 2.0 Client ID"**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
   - For ngrok testing: `https://your-ngrok-url.ngrok-free.app/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

#### Step 2: Update .env
```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

#### Step 3: Implement Strategy
```typescript
// server/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackURL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName, photos } = profile;
    const user = {
      email: emails[0].value,
      name: displayName,
      picture: photos[0]?.value,
      provider: 'google',
    };
    done(null, user);
  }
}
```

### GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App
1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: Web Terminal
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Click **"Register application"**
5. Click **"Generate a new client secret"**
6. Copy **Client ID** and **Client Secret**

#### Step 2: Update .env
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

#### Step 3: Implement Strategy
```typescript
// server/src/auth/strategies/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('github.clientId'),
      clientSecret: configService.get<string>('github.clientSecret'),
      callbackURL: configService.get<string>('github.callbackURL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { emails, displayName, photos } = profile;
    const user = {
      email: emails[0].value,
      name: displayName || profile.username,
      picture: photos[0]?.value,
      provider: 'github',
    };
    return user;
  }
}
```

### Auth Controller Implementation

```typescript
// server/src/auth/auth.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      const token = await this.authService.handleOAuthCallback(req.user);
      // Redirect to frontend with token
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      res.redirect(`http://localhost:5173/auth/callback?error=${error.message}`);
    }
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    try {
      const token = await this.authService.handleOAuthCallback(req.user);
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      res.redirect(`http://localhost:5173/auth/callback?error=${error.message}`);
    }
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  getStatus(@Req() req) {
    return { authenticated: true, user: req.user };
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.json({ message: 'Logged out successfully' });
  }
}
```

### Auth Service Implementation

```typescript
// server/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleOAuthCallback(user: any): Promise<string> {
    // Check if auth is enabled
    const authEnabled = this.configService.get<boolean>('auth.enabled');
    if (!authEnabled) {
      throw new Error('Authentication is disabled');
    }

    // Validate email against allowlist
    const allowedEmails = this.configService.get<string[]>('auth.allowedEmails');
    if (!allowedEmails.includes(user.email)) {
      throw new ForbiddenException(
        `Email ${user.email} is not in the allowed list`,
      );
    }

    // Generate JWT
    const payload = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
    };

    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  validateEmail(email: string): boolean {
    const authEnabled = this.configService.get<boolean>('auth.enabled');
    if (!authEnabled) return true;

    const allowedEmails = this.configService.get<string[]>('auth.allowedEmails');
    return allowedEmails.includes(email);
  }
}
```

---

## Security Best Practices

### 1. Environment Variables
- **Never commit** `.env` to version control
- Use strong, random session secret: `openssl rand -base64 32`
- Set `SESSION_SECRET` environment variable (used for JWT signing)
- Rotate secrets regularly in production
- Use different credentials for dev/staging/production

### 2. JWT Configuration
The JWT configuration uses `SESSION_SECRET` from environment variables:
```typescript
// auth.module.ts - Actual implementation
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('session.secret'), // Uses SESSION_SECRET env var
    signOptions: {
      expiresIn: '7d',
      issuer: 'web-terminal',
      audience: 'web-terminal-client',
    },
  }),
}),
```

**Note:** The secret comes from `SESSION_SECRET` environment variable via `configuration.ts`, not a separate `JWT_SECRET` variable.


### 3. Rate Limiting
Consider adding rate limiting for auth endpoints:
```bash
npm install @nestjs/throttler
```

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per 60 seconds
    }),
  ],
})
```

### 5. Input Validation
Always validate and sanitize inputs:
```typescript
// Use class-validator
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

---

## WebSocket Authentication

### Challenge
WebSocket connections don't support traditional HTTP headers in the initial handshake for all browsers. Solution: Pass token in auth parameters.

### Implementation

#### Client Side
```typescript
// client/src/components/Terminal.tsx
const socket = io('/', {
  auth: {
    token: localStorage.getItem('jwt_token'),
  },
  transports: ['websocket', 'polling'],
});
```

#### Server Side
```typescript
// server/src/terminal/terminal.gateway.ts
@WebSocketGateway({
  cors: { /* ... */ },
})
export class TerminalGateway implements OnGatewayConnection {
  constructor(
    private terminalService: TerminalService,
    private configService: ConfigService,
    private authService: AuthService, // Inject AuthService
  ) {}

  handleConnection(client: Socket) {
    const authEnabled = this.configService.get<boolean>('auth.enabled');

    if (authEnabled) {
      try {
        const token = client.handshake.auth.token;
        if (!token) {
          this.logger.warn(`Client ${client.id} connected without token`);
          client.disconnect();
          return;
        }

        // Verify token
        const user = this.authService.verifyToken(token);

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

    // Continue with normal connection handling
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSessions.set(client.id, new Set());
  }
}
```

---

## Session Management

### Terminal Persistence Architecture

#### Current Behavior (Before Implementation)
- Sessions destroyed immediately on client disconnect (line 57-68 in terminal.gateway.ts)
- No session recovery possible
- Loss of running processes on page reload

#### New Behavior (After Implementation)
- Sessions persist after client disconnect
- Configurable timeout (default: 30 minutes)
- Client can reconnect to existing session
- Automatic cleanup of abandoned sessions

### Implementation Details

#### 1. Enhanced Session Interface
```typescript
// server/src/terminal/terminal.service.ts
interface TerminalSession {
  pty: IPty;
  userId: string | null;      // null if auth disabled
  clientId: string;
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}
```

#### 2. Configuration
```typescript
// server/src/config/configuration.ts
terminal: {
  shell: process.env.TERMINAL_SHELL || '/bin/zsh',
  allowedPath: process.env.TERMINAL_ALLOWED_PATH || process.env.HOME,
  sessionTimeout: parseInt(process.env.TERMINAL_SESSION_TIMEOUT || '1800000', 10), // 30 min
  maxSessions: parseInt(process.env.TERMINAL_MAX_SESSIONS || '10', 10),
}
```

#### 3. Session Cleanup
```typescript
// server/src/terminal/terminal.service.ts
@Injectable()
export class TerminalService implements OnModuleInit {
  private cleanupInterval: NodeJS.Timeout;

  onModuleInit() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.logger.log(`Cleaning up expired session: ${sessionId}`);
        this.destroySession(sessionId);
      }
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    // ... existing cleanup code
  }
}
```

#### 4. Client Reconnection
```typescript
// client/src/components/Terminal.tsx
useEffect(() => {
  // Try to recover existing session
  const existingSessionId = localStorage.getItem(`terminal_session_${sessionId}`);

  if (existingSessionId) {
    socket.emit('reconnect-session', { sessionId: existingSessionId });

    socket.once('session-reconnected', () => {
      console.log('Reconnected to existing session');
    });

    socket.once('session-not-found', () => {
      console.log('Session expired, creating new one');
      socket.emit('create-session', { sessionId });
    });
  } else {
    socket.emit('create-session', { sessionId });
  }

  // Save session ID for future reconnection
  localStorage.setItem(`terminal_session_${sessionId}`, sessionId);
}, [sessionId]);
```

---

## Mobile UI Patterns

### 1. Virtual Keyboard Component

```typescript
// client/src/components/VirtualKeyboard.tsx
import React from 'react';
import './VirtualKeyboard.css';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  visible: boolean;
  onToggle: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  visible,
  onToggle,
}) => {
  const keys = [
    { label: 'Tab', value: '\t', class: 'key-wide' },
    { label: 'Esc', value: '\x1b', class: 'key-normal' },
    { label: '↑', value: '\x1b[A', class: 'key-normal' },
    { label: '↓', value: '\x1b[B', class: 'key-normal' },
    { label: '←', value: '\x1b[D', class: 'key-normal' },
    { label: '→', value: '\x1b[C', class: 'key-normal' },
    { label: 'Ctrl+C', value: '\x03', class: 'key-wide' },
    { label: 'Ctrl+D', value: '\x04', class: 'key-normal' },
    { label: 'Ctrl+Z', value: '\x1a', class: 'key-normal' },
    { label: 'Ctrl+L', value: '\x0c', class: 'key-normal' },
  ];

  if (!visible) {
    return (
      <button className="virtual-keyboard-toggle" onClick={onToggle}>
        ⌨️ Show Keyboard
      </button>
    );
  }

  return (
    <div className="virtual-keyboard">
      <div className="keyboard-header">
        <span>Terminal Keys</span>
        <button onClick={onToggle}>×</button>
      </div>
      <div className="keyboard-grid">
        {keys.map((key) => (
          <button
            key={key.label}
            className={`keyboard-key ${key.class}`}
            onClick={() => onKeyPress(key.value)}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
```

### 2. Virtual Keyboard CSS
```css
/* client/src/components/VirtualKeyboard.css */
.virtual-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
}

.keyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.keyboard-header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 8px;
}

.keyboard-key {
  min-height: 44px; /* iOS minimum touch target */
  padding: 8px;
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.keyboard-key:active {
  background: var(--button-active);
  transform: scale(0.95);
}

.key-wide {
  grid-column: span 2;
}

.virtual-keyboard-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 16px;
  background: var(--button-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Mobile detection */
@media (min-width: 768px) {
  .virtual-keyboard-toggle {
    display: none;
  }
}
```

### 3. Tab Key Handling
```typescript
// In Terminal.tsx
useEffect(() => {
  if (!xtermRef.current) return;

  // Attach custom key handler
  xtermRef.current.attachCustomKeyEventHandler((event) => {
    if (event.type === 'keydown' && event.key === 'Tab') {
      // Prevent default browser Tab behavior
      event.preventDefault();
      return false; // Let xterm.js handle it
    }
    return true; // Allow other keys
  });
}, []);
```

### 4. Mobile Responsive Design
```css
/* client/src/App.css */
@media (max-width: 768px) {
  .header-title {
    font-size: 16px;
  }

  .terminal-container {
    font-size: 12px;
  }

  .tab-button {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
    font-size: 16px; /* Prevents iOS zoom on focus */
  }
}
```

---

## Error Handling

### Backend Error Classes
```typescript
// server/src/auth/auth.errors.ts
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

export class AuthErrors {
  static unauthorized(message = 'Unauthorized access') {
    throw new UnauthorizedException({
      statusCode: 401,
      message,
      error: 'Unauthorized',
    });
  }

  static emailNotAllowed(email: string) {
    throw new ForbiddenException({
      statusCode: 403,
      message: `Email ${email} is not authorized`,
      error: 'Forbidden',
    });
  }

  static invalidToken() {
    throw new UnauthorizedException({
      statusCode: 401,
      message: 'Invalid or expired token',
      error: 'InvalidToken',
    });
  }

  static authDisabled() {
    throw new UnauthorizedException({
      statusCode: 401,
      message: 'Authentication is not enabled',
      error: 'AuthDisabled',
    });
  }
}
```

### Frontend Error Handling
```typescript
// client/src/contexts/AuthContext.tsx
const handleAuthError = (error: any) => {
  if (error.response?.status === 401) {
    // Invalid token
    localStorage.removeItem('jwt_token');
    setIsAuthenticated(false);
    navigate('/login');
  } else if (error.response?.status === 403) {
    // Email not allowed
    setError('Your email is not authorized to access this application');
  } else {
    // Generic error
    setError('An authentication error occurred. Please try again.');
  }
};
```

---

## Testing Strategy

### Unit Tests

#### Auth Service Tests
```typescript
// server/src/auth/auth.service.spec.ts
describe('AuthService', () => {
  it('should generate valid JWT token', async () => {
    const user = { email: 'test@example.com', name: 'Test User' };
    const token = await authService.handleOAuthCallback(user);
    expect(token).toBeDefined();
    const decoded = jwtService.verify(token);
    expect(decoded.email).toBe(user.email);
  });

  it('should reject unauthorized email', async () => {
    const user = { email: 'unauthorized@example.com', name: 'Bad User' };
    await expect(authService.handleOAuthCallback(user))
      .rejects
      .toThrow(ForbiddenException);
  });
});
```

### Integration Tests

#### OAuth Flow Test
```typescript
describe('OAuth Integration', () => {
  it('should complete Google OAuth flow', async () => {
    // Mock OAuth provider response
    // Test callback handling
    // Verify JWT generation
    // Check email validation
  });
});
```

### E2E Tests

```typescript
describe('Authentication E2E', () => {
  it('should login, create terminal, and reconnect', async () => {
    // 1. Login via OAuth
    // 2. Receive JWT token
    // 3. Connect WebSocket with token
    // 4. Create terminal session
    // 5. Disconnect
    // 6. Reconnect to same session
  });
});
```

---

### Environment Variables Checklist

```bash
# Server
PORT=3000
NODE_ENV=production

# Security - CRITICAL!
# Generate with: openssl rand -base64 32
SESSION_SECRET=your-very-strong-secret-here

# Authentication
AUTH_ENABLE=true
AUTH_ALLOWED_EMAILS=user1@company.com,user2@company.com

# OAuth - Google
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-production-client-id
GITHUB_CLIENT_SECRET=your-production-secret
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# Terminal
TERMINAL_SHELL=/bin/bash
TERMINAL_ALLOWED_PATH=/home
TERMINAL_SESSION_TIMEOUT=1800000
TERMINAL_MAX_SESSIONS=10

```

---

## Resources

### Documentation
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [xterm.js Documentation](https://xtermjs.org/)
- [Socket.io Documentation](https://socket.io/docs/v4/)

### Packages Used
- `@nestjs/passport` - Passport integration
- `@nestjs/jwt` - JWT utilities
- `passport-google-oauth20` - Google OAuth
- `passport-github2` - GitHub OAuth
- `socket.io` - WebSocket library
- `@xterm/xterm` - Terminal emulator
- `node-pty` - Terminal backend

---

## Maintenance

### Regular Tasks
- Review and rotate SESSION_SECRET (used for JWT signing) quarterly
- Update OAuth application URLs when domains change
- Monitor authentication success/failure rates
- Review allowlist and remove inactive users
- Update dependencies monthly
- Test OAuth flows after provider updates
- Monitor session cleanup effectiveness
- Review logs for suspicious activity

### Monitoring Metrics
- Authentication success/failure rate
- WebSocket connection errors
- Session creation/destruction rate
- Memory usage of terminal sessions
- Token verification performance
- OAuth callback latency

---

**Last Updated:** October 12, 2025
**Version:** 1.0
**Maintained By:** Development Team
**Context7 Enhanced:** Yes

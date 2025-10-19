# Web Terminal

A comprehensive web-based terminal application built with NestJS, React, and xterm.js. This application provides a full-featured terminal interface accessible through your web browser with multi-tab support, dark/light themes, and configurable access controls.

## Demo

[![Demo Video](https://raw.githubusercontent.com/barnuri/web-terminal/refs/heads/master/assets/demo.mp4)](https://raw.githubusercontent.com/barnuri/web-terminal/refs/heads/master/assets/demo.mp4)

> **Click the image above to watch the demo video** or [download it directly](https://raw.githubusercontent.com/barnuri/web-terminal/master/assets/demo.mp4).

## Features

- **Full Terminal Emulation**: Powered by xterm.js with WebSocket communication
- **Multi-Tab Support**: Open and manage multiple terminal sessions simultaneously
- **Theme Support**: Dark mode (default) and light mode with smooth transitions
- **Configurable Access**: Set allowed directories and shell type via environment variables
- **Secure by Default**: Session-based authentication and path restrictions
- **Modern Stack**: NestJS backend, React frontend with TypeScript throughout
- **Production Ready**: Built with best practices, proper error handling, and logging

## Architecture

```
web-terminal/
├── server/          # NestJS backend
│   ├── src/
│   │   ├── terminal/    # Terminal gateway and service
│   │   ├── config/      # Configuration module
│   │   └── main.ts      # Application entry point
│   └── package.json
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts (theme, terminal)
│   │   ├── hooks/       # Custom hooks
│   │   └── App.tsx      # Main app component
│   └── package.json
└── package.json     # Root workspace configuration
```

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A Unix-like system (Linux, macOS) for terminal functionality

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd web-terminal

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferences
nano .env
```

**Important Environment Variables:**

**Server Configuration:**

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

**Terminal Configuration:**

- `TERMINAL_SHELL`: Shell to use (default: /bin/zsh)
- `TERMINAL_ALLOWED_PATH`: Base directory for terminal access (default: ~)
- `TERMINAL_SESSION_TIMEOUT`: Session timeout in milliseconds (default: 1800000 = 30 min)
- `TERMINAL_MAX_SESSIONS`: Maximum concurrent sessions (default: 10)
- `FOLDERS_SHORTCUTS`: Comma-separated list of folder shortcuts
- `FAV_CMDS`: Comma-separated list of favorite commands

**Security (REQUIRED for production):**

- `SESSION_SECRET`: Secret for JWT tokens and session management
  - **CRITICAL**: Must be changed in production!
  - Generate with: `openssl rand -base64 32`

**Authentication (Optional):**

- `AUTH_ENABLE`: Enable authentication (true/false, default: false)
- `AUTH_ALLOWED_EMAILS`: Comma-separated list of allowed email addresses
- `AUTH_STATIC_SECRET`: Simple password-based authentication (alternative to OAuth)

**OAuth - Google (Optional):**

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: Google OAuth callback URL

**OAuth - GitHub (Optional):**

- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `GITHUB_CALLBACK_URL`: GitHub OAuth callback URL

**Other:**

- `NGROK_AUTHTOKEN`: Ngrok auth token for exposing local server (optional)

### 3. Development Mode

```bash
# Start both server and client in development mode
npm run dev

# Or start them individually:
npm run dev:server  # Server on port 3000
npm run dev:client  # Client on port 5173
```

Visit `http://localhost:5173` to access the application.

### 4. Production Build

```bash
# Build both client and server
npm run build

# Start the production server
npm start
```

The server will serve the React build at `http://localhost:3000`.

## Configuration

Web Terminal supports multiple configuration methods with the following priority order:

1. **Environment variables** (highest priority)
2. **config.local.yaml/json** (gitignored, for local overrides)
3. **config.{NODE_ENV}.yaml/json** (environment-specific)
4. **config.yaml/json** (default configuration)

### Configuration Methods

#### Method 1: Configuration Files (Recommended)

Create a configuration file in YAML or JSON format:

**YAML format (config.yaml):**

```yaml
port: 3000
nodeEnv: production
terminal:
  shell: /bin/zsh
  allowedPath: /home
  sessionTimeout: 1800000
  maxSessions: 10
  folderShortcuts:
    - /home/user/projects
    - /var/www
  favoriteCommands:
    - git status
    - npm test
session:
  secret: your-super-secret-key-here-CHANGE-THIS
auth:
  enabled: false
  allowedEmails:
    - user1@example.com
```

**JSON format (config.json):**

```json
{
  "port": 3000,
  "nodeEnv": "production",
  "terminal": {
    "shell": "/bin/zsh",
    "allowedPath": "/home",
    "sessionTimeout": 1800000,
    "maxSessions": 10,
    "folderShortcuts": ["/home/user/projects", "/var/www"],
    "favoriteCommands": ["git status", "npm test"]
  },
  "session": {
    "secret": "your-super-secret-key-here-CHANGE-THIS"
  },
  "auth": {
    "enabled": false,
    "allowedEmails": ["user1@example.com"]
  }
}
```

**Example files are provided:**

- Copy `config.example.yaml` to `config.yaml` and customize
- Or copy `config.example.json` to `config.json` and customize

**Environment-specific configuration:**

- `config.development.yaml` - Loaded when NODE_ENV=development
- `config.production.yaml` - Loaded when NODE_ENV=production
- `config.local.yaml` - Local overrides (gitignored, highest priority)

#### Method 2: Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Terminal Configuration
TERMINAL_SHELL=/bin/zsh
TERMINAL_ALLOWED_PATH=~

# Security - CRITICAL: Generate a secure secret!
# Use: openssl rand -base64 32
SESSION_SECRET=your-super-secret-key-here-CHANGE-THIS

# Authentication (Optional - leave AUTH_ENABLE=false if not needed)
AUTH_ENABLE=false
AUTH_ALLOWED_EMAILS=user1@example.com,user2@example.com

# Ngrok (Optional)
NGROK_AUTHTOKEN=your-ngrok-authtoken
```

**Note:** Environment variables override configuration file values, allowing you to use files for defaults and environment variables for sensitive data or deployment-specific overrides.

### Supported Shells

The application supports any shell available on your system:

- `/bin/bash`
- `/bin/zsh` (default)
- `/bin/sh`
- `/bin/fish`
- Custom shells (provide full path)

### Access Control

The `TERMINAL_ALLOWED_PATH` variable restricts terminal access to a specific directory and its subdirectories. For example:

- `/home` - Access to all user home directories
- `/home/username` - Access only to a specific user's directory
- `/` - Full system access (not recommended for production)

## Usage

### Creating New Tabs

1. Click the "+" button in the tab bar
2. A new terminal session will open
3. Each tab maintains its own independent session

### Switching Themes

1. Click the theme toggle button (sun/moon icon) in the header
2. The theme persists across sessions via localStorage

### Closing Tabs

1. Click the "×" button on any tab to close it
2. The last tab cannot be closed (at least one must remain open)

## Security Considerations

### For Production Deployment:

1. **⚠️ CRITICAL - Change SESSION_SECRET**:
   - The default value is INSECURE and will show warnings
   - Generate a secure secret: `openssl rand -base64 32`
   - Never commit the actual secret to version control
   - This secret is used for JWT token signing and session management
2. **Set TERMINAL_ALLOWED_PATH**: Restrict to necessary directories only
3. **Use HTTPS**: Always serve over HTTPS in production
4. **Implement Authentication**: Enable AUTH_ENABLE=true and configure OAuth or static secret
5. **Configure Email Allowlist**: Set AUTH_ALLOWED_EMAILS to restrict access
6. **Use Reverse Proxy**: Deploy behind nginx or similar
7. **Enable Firewall**: Restrict access at network level
8. **Regular Updates**: Keep dependencies updated

### Additional Security Measures:

- Rate limiting (recommended)
- IP whitelisting
- User-based directory isolation
- Command logging and auditing
- Timeout for idle sessions

## API Documentation

### WebSocket Events

**Client → Server:**

- `create-session`: Create a new terminal session
- `resize`: Resize terminal dimensions
- `input`: Send input to terminal

**Server → Client:**

- `session-created`: Session successfully created
- `output`: Terminal output data
- `error`: Error message

## Troubleshooting

### Terminal Not Connecting

1. Check if the backend is running (`npm run dev:server`)
2. Verify WebSocket connection in browser console
3. Check firewall/proxy settings

### Permission Errors

1. Verify `TERMINAL_ALLOWED_PATH` exists and is accessible
2. Check shell path is correct in `TERMINAL_SHELL`
3. Ensure the server process has necessary permissions

### Build Errors

1. Clear node_modules: `npm run clean && npm run install:all`
2. Ensure Node.js version >= 18.0.0
3. Check for conflicting dependencies

## Development

### Project Structure

```
server/src/
├── terminal/
│   ├── terminal.gateway.ts    # WebSocket gateway
│   ├── terminal.service.ts    # Terminal session management
│   └── terminal.module.ts     # Terminal module
├── config/
│   └── configuration.ts       # Configuration schema
└── main.ts                    # Entry point

client/src/
├── components/
│   ├── Terminal.tsx           # Terminal component
│   ├── TerminalTab.tsx        # Tab management
│   └── ThemeToggle.tsx        # Theme switcher
├── contexts/
│   ├── ThemeContext.tsx       # Theme state
│   └── TerminalContext.tsx    # Terminal state
└── App.tsx                    # Main application
```

### Adding Features

1. **Backend**: Add new gateways/services in `server/src/`
2. **Frontend**: Add new components in `client/src/components/`
3. **Configuration**: Update `server/src/config/configuration.ts`

### Running Tests

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

## Technologies Used

### Backend

- **NestJS**: Progressive Node.js framework
- **Socket.IO**: Real-time WebSocket communication
- **node-pty**: Pseudoterminal bindings
- **TypeScript**: Type-safe development

### Frontend

- **React 18**: Modern React with hooks
- **xterm.js**: Terminal emulator
- **Socket.IO Client**: WebSocket client
- **Vite**: Fast build tool
- **TypeScript**: Type safety

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [Socket.IO](https://socket.io/) - Real-time communication

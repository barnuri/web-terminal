# Web Terminal

A comprehensive web-based terminal application built with NestJS, React, and xterm.js. This application provides a full-featured terminal interface accessible through your web browser with multi-tab support, dark/light themes, and configurable access controls.

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

- `PORT`: Server port (default: 3000)
- `TERMINAL_SHELL`: Shell to use (default: /bin/zsh)
- `TERMINAL_ALLOWED_PATH`: Base directory for terminal access (default: ~)
- `SESSION_SECRET`: Secret for session management (change in production!)

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

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Terminal Configuration
TERMINAL_SHELL=/bin/zsh
TERMINAL_ALLOWED_PATH=~

# Security
SESSION_SECRET=your-super-secret-key-here

# CORS (only needed for development)
CORS_ORIGIN=http://localhost:5173
NGROK_AUTHTOKEN=your-ngrok-authtoken
```

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

1. **Change SESSION_SECRET**: Use a strong, random string
2. **Set TERMINAL_ALLOWED_PATH**: Restrict to necessary directories only
3. **Use HTTPS**: Always serve over HTTPS in production
4. **Implement Authentication**: Add user authentication before exposing publicly
5. **Use Reverse Proxy**: Deploy behind nginx or similar
6. **Enable Firewall**: Restrict access at network level
7. **Regular Updates**: Keep dependencies updated

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

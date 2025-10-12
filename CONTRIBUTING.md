# Contributing to Web Terminal

Thank you for your interest in contributing to Web Terminal! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/web-terminal.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm run install:all`
5. Make your changes
6. Test your changes thoroughly
7. Commit with clear messages
8. Push to your fork
9. Create a Pull Request

## Development Workflow

### Running the Project

```bash
# Development mode (both server and client)
npm run dev

# Server only
npm run dev:server

# Client only
npm run dev:client
```

### Building

```bash
# Build everything
npm run build

# Build client only
npm run build:client

# Build server only
npm run build:server
```

### Testing

```bash
# Run server tests
cd server && npm test

# Run client tests
cd client && npm test
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (Prettier configuration provided)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Linting

```bash
# Lint server
cd server && npm run lint

# Lint client
cd client && npm run lint
```

## Commit Messages

Follow conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add terminal history search`

## Pull Request Process

1. Update README.md if needed
2. Update documentation for new features
3. Ensure all tests pass
4. Update the CHANGELOG.md (if present)
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

## Project Structure

```
web-terminal/
├── server/              # NestJS backend
│   ├── src/
│   │   ├── terminal/   # Terminal gateway & service
│   │   ├── config/     # Configuration
│   │   └── main.ts     # Entry point
│   └── package.json
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts
│   │   └── App.tsx     # Main app
│   └── package.json
└── package.json         # Root workspace
```

## Adding New Features

### Backend (NestJS)

1. Create new module in `server/src/`
2. Add service and controller/gateway
3. Register in `app.module.ts`
4. Add tests

### Frontend (React)

1. Create components in `client/src/components/`
2. Add context if needed in `client/src/contexts/`
3. Update App.tsx if necessary
4. Add styles following existing patterns

## Testing Guidelines

- Write unit tests for new functions
- Test edge cases
- Ensure WebSocket connections work properly
- Test theme switching
- Test terminal operations (input, resize, etc.)

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for functions
- Document environment variables
- Update API documentation if applicable

## Security

- Never commit `.env` files
- Validate all user inputs
- Follow path access restrictions
- Report security issues privately to maintainers

## Questions?

Open an issue for:

- Bug reports
- Feature requests
- Questions about implementation
- General discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

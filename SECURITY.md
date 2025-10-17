# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in Web Terminal, please report it privately to the maintainers. Do not open a public issue.

## Security Best Practices

### 1. SESSION_SECRET

**CRITICAL**: The `SESSION_SECRET` environment variable is used for:
- JWT token signing
- Session management
- Authentication security

**Required Actions:**
- Generate a strong secret: `openssl rand -base64 32`
- Never use the default value in production
- Never commit secrets to version control
- Rotate secrets regularly (quarterly recommended)

### 2. Authentication

- Enable `AUTH_ENABLE=true` when exposing to the internet
- Configure OAuth (Google/GitHub) or use `AUTH_STATIC_SECRET`
- Use `AUTH_ALLOWED_EMAILS` to restrict access to specific users
- Keep OAuth client secrets secure

### 3. Terminal Access

- Set `TERMINAL_ALLOWED_PATH` to restrict file system access
- Use the most restrictive path possible for your use case
- Never set to `/` in production unless absolutely necessary
- Consider user-specific path restrictions

### 4. Network Security

- Always use HTTPS in production
- Deploy behind a reverse proxy (nginx, Apache)
- Enable firewall rules to restrict access
- Consider IP whitelisting for sensitive deployments
- Use rate limiting to prevent abuse

### 5. Dependencies

- Regularly update dependencies: `npm audit`
- Review security advisories
- Test updates in development before production
- Keep Node.js version up to date

### 6. Deployment

- Use `NODE_ENV=production`
- Disable debug logging in production
- Set appropriate session timeouts
- Limit maximum concurrent sessions
- Monitor for suspicious activity

## Default Security Warnings

The application will warn you if:
- `SESSION_SECRET` is not set (using insecure default)
- Authentication is disabled in production
- Default or weak secrets are detected

**Do not ignore these warnings!**

## Security Checklist for Production

- [ ] `SESSION_SECRET` is set to a strong, randomly generated value
- [ ] `AUTH_ENABLE=true` if exposing to internet
- [ ] OAuth or static secret authentication is configured
- [ ] `AUTH_ALLOWED_EMAILS` is properly configured
- [ ] `TERMINAL_ALLOWED_PATH` is restrictive
- [ ] HTTPS is enabled
- [ ] Reverse proxy is configured
- [ ] Firewall rules are in place
- [ ] Dependencies are up to date
- [ ] Monitoring and logging are enabled

## Known Security Considerations

1. **Terminal Access**: This application provides direct terminal access. Only deploy in trusted environments or with proper authentication.

2. **WebSocket Security**: WebSocket connections are authenticated via JWT tokens passed in the handshake.

3. **Session Persistence**: Terminal sessions persist for 30 minutes by default. Adjust `TERMINAL_SESSION_TIMEOUT` as needed.

4. **OAuth Tokens**: OAuth access tokens are not stored; only JWTs signed with your `SESSION_SECRET` are used.

## Questions?

For security questions or concerns, please open a private security advisory on GitHub or contact the maintainers directly.

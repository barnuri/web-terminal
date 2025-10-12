# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Considerations

This application provides terminal access through a web browser. As such, it requires careful security considerations before deployment, especially in production environments.

### Critical Security Warnings

1. **Authentication Required**: This application does NOT include built-in authentication. Do NOT expose it to the public internet without implementing proper authentication.

2. **Path Restrictions**: Always configure `TERMINAL_ALLOWED_PATH` to restrict access to specific directories only.

3. **HTTPS Only**: Always serve this application over HTTPS in production to protect data in transit.

4. **Session Secret**: Always change the default `SESSION_SECRET` to a strong, random value.

5. **Network Isolation**: Deploy behind a firewall and restrict access to trusted networks only.

## Built-in Security Features

### Path Validation

The terminal service validates and restricts access to directories specified in `TERMINAL_ALLOWED_PATH`. Users cannot navigate outside this directory tree.

```typescript
// Example configuration
TERMINAL_ALLOWED_PATH=/home/username
```

### Session Isolation

Each WebSocket client maintains isolated terminal sessions. Sessions are destroyed when clients disconnect.

### Input Sanitization

User input is passed directly to the terminal session without modification, as this is required for terminal functionality. Implement additional input validation if needed.

## Recommended Security Measures

### 1. Implement Authentication

Add user authentication before granting terminal access. Consider:

- OAuth2/OIDC (Google, GitHub, etc.)
- LDAP/Active Directory
- Basic Auth over HTTPS
- JWT-based authentication

### 2. Network Security

```nginx
# Nginx example: Restrict to specific IPs
location / {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://localhost:3000;
}
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// NestJS example
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

### 4. Command Auditing

Log all commands executed through the terminal:

```typescript
// Example logging
ptyProcess.onData((data) => {
  logger.log(`Session ${sessionId}: ${data}`);
  onData(data);
});
```

### 5. Session Timeout

Implement automatic session timeout for idle connections:

```typescript
// Example timeout implementation
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
setTimeout(() => {
  destroySession(sessionId);
}, SESSION_TIMEOUT);
```

### 6. Firewall Rules

```bash
# UFW example
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw enable
```

### 7. User Isolation

If supporting multiple users, ensure proper user isolation:

- Run terminal sessions as specific users
- Use Linux namespaces or containers
- Implement proper file permissions

### 8. SSL/TLS Configuration

Always use HTTPS with strong ciphers:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### 9. Content Security Policy

Add CSP headers:

```typescript
// NestJS example
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

### 10. Regular Updates

Keep dependencies updated:

```bash
npm audit
npm update
```

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public issue
2. Email the maintainers privately at [security@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices for Deployment

### Production Checklist

- [ ] Change `SESSION_SECRET` to a strong random value
- [ ] Configure `TERMINAL_ALLOWED_PATH` to restrict access
- [ ] Implement user authentication
- [ ] Deploy behind HTTPS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable command auditing
- [ ] Implement session timeouts
- [ ] Configure proper CORS settings
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup critical data
- [ ] Document security procedures
- [ ] Train administrators

### Environment Variables Security

Never commit `.env` files to version control:

```bash
# .gitignore
.env
.env.local
.env.production
```

Use environment variable management systems in production:
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets
- Environment-specific config files

### Docker Security

If using Docker:

```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Read-only root filesystem
RUN chmod -R 555 /app

# Drop capabilities
--cap-drop=ALL
```

### Monitoring and Alerts

Set up monitoring for:
- Failed authentication attempts
- Suspicious command patterns
- High resource usage
- Unusual connection patterns
- Error rates

## Compliance Considerations

Depending on your use case, consider:

- **GDPR**: If handling EU user data
- **HIPAA**: If handling healthcare data
- **SOC 2**: For enterprise deployments
- **PCI DSS**: If handling payment data

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [WebSocket Security](https://devcenter.heroku.com/articles/websocket-security)

## Disclaimer

This application is provided as-is without warranty. Users are responsible for implementing appropriate security measures for their specific use case and environment.

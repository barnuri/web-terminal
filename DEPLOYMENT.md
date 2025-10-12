# Deployment Guide

This guide covers various deployment options for the Web Terminal application.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A Unix-like system (Linux or macOS)
- Proper security configurations

## Production Deployment Steps

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=production
PORT=3000
TERMINAL_SHELL=/bin/zsh
TERMINAL_ALLOWED_PATH=/home
SESSION_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_STRING
```

**Important:** Generate a strong random string for `SESSION_SECRET`:
```bash
openssl rand -base64 32
```

### 2. Build the Application

```bash
# Install dependencies
npm run install:all

# Build both client and server
npm run build
```

This will:
- Build the React client to `client/dist`
- Build the NestJS server to `server/dist`
- The server will serve the client from `client/dist`

### 3. Start the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'web-terminal',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/web-terminal',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

3. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Using systemd

1. Create `/etc/systemd/system/web-terminal.service`:
```ini
[Unit]
Description=Web Terminal Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/web-terminal
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

2. Enable and start:
```bash
sudo systemctl enable web-terminal
sudo systemctl start web-terminal
```

### Option 2: Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

2. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  web-terminal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TERMINAL_SHELL=/bin/zsh
      - TERMINAL_ALLOWED_PATH=/home
      - SESSION_SECRET=${SESSION_SECRET}
    volumes:
      - /home:/home:ro
    restart: unless-stopped
```

3. Deploy:
```bash
docker-compose up -d
```

### Option 3: Cloudflare Pages + Workers (Not Recommended for This App)

This application requires WebSocket support and terminal access, which is not suitable for serverless/edge deployments like Cloudflare Pages. Consider using Cloudflare Tunnel for secure access instead.

### Option 4: Nginx Reverse Proxy

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Create Nginx configuration `/etc/nginx/sites-available/web-terminal`:
```nginx
upstream web-terminal {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://web-terminal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://web-terminal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/web-terminal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 5: SSL/HTTPS with Let's Encrypt

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

3. Auto-renewal is configured automatically.

## Security Hardening

### Firewall

```bash
# UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Fail2Ban (Optional)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Application Security

1. **Change SESSION_SECRET**: Use a strong, random string
2. **Restrict TERMINAL_ALLOWED_PATH**: Limit to necessary directories
3. **Use HTTPS**: Always in production
4. **Implement Authentication**: Add user login before allowing terminal access
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse
6. **Network Isolation**: Use firewall rules to restrict access

## Monitoring

### Using PM2

```bash
pm2 monit
pm2 logs web-terminal
```

### Log Files

Application logs are written to:
- stdout (captured by PM2 or systemd)
- Can be configured in NestJS logger

### Health Checks

Create a health check endpoint in the backend if needed.

## Backup and Recovery

1. **Configuration**: Backup `.env` file
2. **Data**: If you add database, backup regularly
3. **Code**: Keep in version control (Git)

## Scaling

### Horizontal Scaling

Use a load balancer (Nginx, HAProxy) to distribute traffic across multiple instances.

**Note**: Sticky sessions required for WebSocket connections.

### Vertical Scaling

Increase server resources (CPU, RAM) as needed.

## Troubleshooting

### Terminal Not Working

1. Check terminal shell path: `which zsh`
2. Verify permissions for TERMINAL_ALLOWED_PATH
3. Check logs: `pm2 logs` or `journalctl -u web-terminal`

### WebSocket Connection Failed

1. Check Nginx WebSocket configuration
2. Verify firewall allows WebSocket traffic
3. Check CORS settings

### High CPU Usage

1. Limit number of concurrent terminal sessions
2. Implement session timeout
3. Monitor for abuse

## Environment Variables Reference

- `NODE_ENV`: production | development
- `PORT`: Server port (default: 3000)
- `TERMINAL_SHELL`: Shell path (default: /bin/zsh)
- `TERMINAL_ALLOWED_PATH`: Base directory for terminal access
- `SESSION_SECRET`: Secret for session management
- `CORS_ORIGIN`: CORS origin (development only)

## Support

For deployment issues, please open an issue on GitHub.

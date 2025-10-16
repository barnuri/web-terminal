# Web Terminal - Quick Start Guide

Get up and running in 5 minutes!

---

## Option 1: Quick Start (No Auth)

**Perfect for testing or internal use without authentication**

```bash
# 1. Install dependencies
npm run install:all

# 2. Start the application
npm run dev
```

That's it! Open http://localhost:5173 and start using the terminal.

---

## Option 2: With Authentication

**For production use with Google/GitHub OAuth**

### Step 1: Set Up Google OAuth (5 minutes)

1. Go to https://console.cloud.google.com/
2. Create a project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Select "Web application"
6. Add redirect URI: `http://localhost:3000/auth/google/callback`
7. Save and copy the **Client ID** and **Client Secret**

### Step 2: Set Up GitHub OAuth (3 minutes)

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Name: "Web Terminal"
   - Homepage: `http://localhost:3000`
   - Callback: `http://localhost:3000/auth/github/callback`
4. Click "Register application"
5. Generate a client secret
6. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Environment

```bash
# Edit server/.env
AUTH_ENABLE=true
AUTH_ALLOWED_EMAILS=your-email@gmail.com,teammate@company.com

# Add OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Generate a strong secret (or use this command):
# openssl rand -base64 32
SESSION_SECRET=your-random-secret-here
```

### Step 4: Run

```bash
npm run dev
```

Open http://localhost:5173 and click "Sign in with Google" or "Sign in with GitHub"!

---

## Mobile Usage

On mobile devices:
1. Tap the **⌨️ button** in the bottom-right corner
2. Use the virtual keyboard for special keys (Tab, Ctrl+C, arrows, etc.)
3. Tap the × to close the keyboard

---

## Testing Terminal Persistence

1. Start a long-running command: `top` or `tail -f /var/log/system.log`
2. **Refresh the browser** or close and reopen the tab
3. Your terminal session should reconnect automatically!
4. Sessions expire after 30 minutes of inactivity (configurable)

---

## Common Commands

```bash
# Install dependencies
npm run install:all

# Development mode (hot reload)
npm run dev

# Run server only
npm run dev:server

# Run client only
npm run dev:client

# Build for production
npm run build

# Start production server
npm start

# Format code
npm run format
```

---

## Troubleshooting

### "Email not in allowed list"
→ Add your email to `AUTH_ALLOWED_EMAILS` in `server/.env`

### OAuth redirect fails
→ Check that callback URLs in OAuth apps match exactly:
- Google: `http://localhost:3000/auth/google/callback`
- GitHub: `http://localhost:3000/auth/github/callback`

### "Authentication required" on terminal
→ Make sure you're logged in, or set `AUTH_ENABLE=false` for testing

### Terminal keys don't work on mobile
→ Tap the ⌨️ button to show the virtual keyboard

### Session doesn't persist
→ Check `TERMINAL_SESSION_TIMEOUT` in server/.env (default: 30 minutes)

---

## What's Next?

- **Production Deployment**: See IMPLEMENTATION_SUMMARY.md
- **Best Practices**: See AGENTS.md
- **Full Documentation**: See README.md
- **Task Details**: See TODOS.md

---

**Happy Terminal-ing!** 🚀

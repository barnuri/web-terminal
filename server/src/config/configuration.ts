export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  terminal: {
    shell: process.env.TERMINAL_SHELL || '/bin/zsh',
    allowedPath: process.env.TERMINAL_ALLOWED_PATH || process.env.HOME || '~',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  },
  auth: {
    enabled: process.env.AUTH_ENABLE === 'true',
    allowedEmails: (process.env.AUTH_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
  },
});

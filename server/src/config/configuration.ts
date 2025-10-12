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
});

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  terminal: {
    shell: process.env.TERMINAL_SHELL || '/bin/zsh',
    allowedPath: process.env.TERMINAL_ALLOWED_PATH || process.env.HOME || '~',
    sessionTimeout: parseInt(process.env.TERMINAL_SESSION_TIMEOUT || '1800000', 10), // 30 minutes
    maxSessions: parseInt(process.env.TERMINAL_MAX_SESSIONS || '10', 10),
    folderShortcuts: (process.env.FOLDERS_SHORTCUTS || '')
      .split(',')
      .map((path) => path.trim())
      .filter((path) => path.length > 0),
    favoriteCommands: (process.env.FAV_CMDS || '')
      .split(',')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0),
  },
  session: {
    secret: process.env.SESSION_SECRET || (() => {
      console.warn('⚠️  WARNING: SESSION_SECRET is not set! Using insecure default. This is NOT safe for production!');
      console.warn('⚠️  Generate a secure secret with: openssl rand -base64 32');
      return 'INSECURE-DEFAULT-DO-NOT-USE-IN-PRODUCTION';
    })(),
  },
  auth: {
    enabled: process.env.AUTH_ENABLE === 'true',
    allowedEmails: (process.env.AUTH_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0),
    staticSecret: process.env.AUTH_STATIC_SECRET || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '', // Will be determined dynamically if not set
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || '', // Will be determined dynamically if not set
  },
});

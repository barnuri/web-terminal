import { loadConfigFile, deepMerge } from './file-loader';

/**
 * Configuration factory that supports:
 * 1. Default values
 * 2. YAML/JSON file-based configuration
 * 3. Environment variables (highest priority)
 *
 * Merge priority: defaults → file config → env vars (env vars are strongest)
 */
export default () => {
  // 1. Define default configuration
  const defaults = getDefaults();

  // 2. Load configuration from file (if exists)
  const fileConfig = loadConfigFile();

  // 3. Load configuration from environment variables (only if set)
  const envConfig = loadEnvConfig();

  // 4. Deep merge: defaults → file → env (env is strongest)
  let config = deepMerge(defaults, fileConfig || {});
  config = deepMerge(config, envConfig);

  return config;
};

/**
 * Get default configuration values
 */
function getDefaults(): any {
  return {
    port: 3000,
    nodeEnv: 'development',
    terminal: {
      shell: '/bin/zsh',
      allowedPath: process.env.HOME || '~',
      sessionTimeout: 1800000, // 30 minutes
      maxSessions: 10,
      folderShortcuts: [],
      favoriteCommands: [],
    },
    session: {
      secret: (() => {
        console.warn(
          '⚠️  WARNING: SESSION_SECRET is not set! Using insecure default. This is NOT safe for production!',
        );
        console.warn('⚠️  Generate a secure secret with: openssl rand -base64 32');
        return 'INSECURE-DEFAULT-DO-NOT-USE-IN-PRODUCTION';
      })(),
    },
    auth: {
      enabled: false,
      allowedEmails: [],
      staticSecret: '',
    },
    google: {
      clientId: '',
      clientSecret: '',
      callbackURL: '',
    },
    github: {
      clientId: '',
      clientSecret: '',
      callbackURL: '',
    },
  };
}

/**
 * Load configuration from environment variables
 * Only includes values that are explicitly set
 */
function loadEnvConfig(): any {
  const envConfig: any = {};

  // Port
  if (process.env.PORT) {
    envConfig.port = parseInt(process.env.PORT, 10);
  }

  // Node environment
  if (process.env.NODE_ENV) {
    envConfig.nodeEnv = process.env.NODE_ENV;
  }

  // Terminal configuration
  const terminal: any = {};
  if (process.env.TERMINAL_SHELL) {
    terminal.shell = process.env.TERMINAL_SHELL;
  }
  if (process.env.TERMINAL_ALLOWED_PATH) {
    terminal.allowedPath = process.env.TERMINAL_ALLOWED_PATH;
  }
  if (process.env.TERMINAL_SESSION_TIMEOUT) {
    terminal.sessionTimeout = parseInt(process.env.TERMINAL_SESSION_TIMEOUT, 10);
  }
  if (process.env.TERMINAL_MAX_SESSIONS) {
    terminal.maxSessions = parseInt(process.env.TERMINAL_MAX_SESSIONS, 10);
  }
  if (process.env.FOLDERS_SHORTCUTS) {
    terminal.folderShortcuts = process.env.FOLDERS_SHORTCUTS.split(',')
      .map((path) => path.trim())
      .filter((path) => path.length > 0);
  }
  if (process.env.FAV_CMDS) {
    terminal.favoriteCommands = process.env.FAV_CMDS.split(',')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);
  }
  if (Object.keys(terminal).length > 0) {
    envConfig.terminal = terminal;
  }

  // Session configuration
  const session: any = {};
  if (process.env.SESSION_SECRET) {
    session.secret = process.env.SESSION_SECRET;
  }
  if (Object.keys(session).length > 0) {
    envConfig.session = session;
  }

  // Auth configuration
  const auth: any = {};
  if (process.env.AUTH_ENABLE !== undefined) {
    auth.enabled = process.env.AUTH_ENABLE === 'true';
  }
  if (process.env.AUTH_ALLOWED_EMAILS) {
    auth.allowedEmails = process.env.AUTH_ALLOWED_EMAILS.split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }
  if (process.env.AUTH_STATIC_SECRET) {
    auth.staticSecret = process.env.AUTH_STATIC_SECRET;
  }
  if (Object.keys(auth).length > 0) {
    envConfig.auth = auth;
  }

  // Google OAuth
  const google: any = {};
  if (process.env.GOOGLE_CLIENT_ID) {
    google.clientId = process.env.GOOGLE_CLIENT_ID;
  }
  if (process.env.GOOGLE_CLIENT_SECRET) {
    google.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }
  if (process.env.GOOGLE_CALLBACK_URL) {
    google.callbackURL = process.env.GOOGLE_CALLBACK_URL;
  }
  if (Object.keys(google).length > 0) {
    envConfig.google = google;
  }

  // GitHub OAuth
  const github: any = {};
  if (process.env.GITHUB_CLIENT_ID) {
    github.clientId = process.env.GITHUB_CLIENT_ID;
  }
  if (process.env.GITHUB_CLIENT_SECRET) {
    github.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }
  if (process.env.GITHUB_CALLBACK_URL) {
    github.callbackURL = process.env.GITHUB_CALLBACK_URL;
  }
  if (Object.keys(github).length > 0) {
    envConfig.github = github;
  }

  return envConfig;
}

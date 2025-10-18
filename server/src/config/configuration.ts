import { loadConfigFile, mergeConfig } from './file-loader';

/**
 * Configuration factory that supports:
 * 1. YAML/JSON file-based configuration
 * 2. Environment variables (with higher priority)
 *
 * File priority order:
 * - config.local.yaml/json (highest priority, gitignored)
 * - config.{NODE_ENV}.yaml/json (environment-specific)
 * - config.yaml/json (default)
 */
export default () => {
  // Load configuration from file (if exists)
  const fileConfig = loadConfigFile();

  // Build configuration from environment variables
  // Only include values that are explicitly set
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
  envConfig.terminal = {};
  if (process.env.TERMINAL_SHELL) {
    envConfig.terminal.shell = process.env.TERMINAL_SHELL;
  }
  if (process.env.TERMINAL_ALLOWED_PATH) {
    envConfig.terminal.allowedPath = process.env.TERMINAL_ALLOWED_PATH;
  } else if (process.env.HOME) {
    envConfig.terminal.allowedPath = process.env.HOME;
  }
  if (process.env.TERMINAL_SESSION_TIMEOUT) {
    envConfig.terminal.sessionTimeout = parseInt(process.env.TERMINAL_SESSION_TIMEOUT, 10);
  }
  if (process.env.TERMINAL_MAX_SESSIONS) {
    envConfig.terminal.maxSessions = parseInt(process.env.TERMINAL_MAX_SESSIONS, 10);
  }
  if (process.env.FOLDERS_SHORTCUTS) {
    envConfig.terminal.folderShortcuts = process.env.FOLDERS_SHORTCUTS.split(',')
      .map((path) => path.trim())
      .filter((path) => path.length > 0);
  }
  if (process.env.FAV_CMDS) {
    envConfig.terminal.favoriteCommands = process.env.FAV_CMDS.split(',')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);
  }

  // Session configuration
  envConfig.session = {};
  if (process.env.SESSION_SECRET) {
    envConfig.session.secret = process.env.SESSION_SECRET;
  }

  // Auth configuration
  envConfig.auth = {};
  if (process.env.AUTH_ENABLE !== undefined) {
    envConfig.auth.enabled = process.env.AUTH_ENABLE === 'true';
  }
  if (process.env.AUTH_ALLOWED_EMAILS) {
    envConfig.auth.allowedEmails = process.env.AUTH_ALLOWED_EMAILS.split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }
  if (process.env.AUTH_STATIC_SECRET) {
    envConfig.auth.staticSecret = process.env.AUTH_STATIC_SECRET;
  }

  // Google OAuth
  envConfig.google = {};
  if (process.env.GOOGLE_CLIENT_ID) {
    envConfig.google.clientId = process.env.GOOGLE_CLIENT_ID;
  }
  if (process.env.GOOGLE_CLIENT_SECRET) {
    envConfig.google.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }
  if (process.env.GOOGLE_CALLBACK_URL) {
    envConfig.google.callbackURL = process.env.GOOGLE_CALLBACK_URL;
  }

  // GitHub OAuth
  envConfig.github = {};
  if (process.env.GITHUB_CLIENT_ID) {
    envConfig.github.clientId = process.env.GITHUB_CLIENT_ID;
  }
  if (process.env.GITHUB_CLIENT_SECRET) {
    envConfig.github.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }
  if (process.env.GITHUB_CALLBACK_URL) {
    envConfig.github.callbackURL = process.env.GITHUB_CALLBACK_URL;
  }

  // Merge file config with env config (env vars take precedence)
  const mergedConfig = mergeConfig(fileConfig, envConfig);

  // Apply defaults for required values not in file or env
  return applyDefaults(mergedConfig);
};

/**
 * Apply default values for required configuration
 */
function applyDefaults(config: any): any {
  const defaults = {
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

  // Deep merge defaults with config (config takes precedence)
  return deepMerge(defaults, config);
}

/**
 * Deep merge two objects, with priority to the second object
 */
function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') {
    return target;
  }

  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      // If both are objects (but not arrays), merge recursively
      if (
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue) &&
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        // Otherwise, source value takes precedence
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

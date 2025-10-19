import configuration from './configuration';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('port configuration', () => {
    it('should use default port 3000 when PORT is not set', () => {
      delete process.env.PORT;
      const config = configuration();
      expect(config.port).toBe(3000);
    });

    it('should use PORT from environment variable', () => {
      process.env.PORT = '8080';
      const config = configuration();
      expect(config.port).toBe(8080);
    });

    it('should parse PORT as integer', () => {
      process.env.PORT = '5000';
      const config = configuration();
      expect(config.port).toBe(5000);
      expect(typeof config.port).toBe('number');
    });
  });

  describe('nodeEnv configuration', () => {
    it('should use default development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const config = configuration();
      expect(config.nodeEnv).toBe('development');
    });

    it('should use NODE_ENV from environment variable', () => {
      process.env.NODE_ENV = 'production';
      const config = configuration();
      expect(config.nodeEnv).toBe('production');
    });
  });

  describe('terminal configuration', () => {
    it('should use default shell /bin/zsh when TERMINAL_SHELL is not set', () => {
      delete process.env.TERMINAL_SHELL;
      const config = configuration();
      expect(config.terminal.shell).toBe('/bin/zsh');
    });

    it('should use TERMINAL_SHELL from environment variable', () => {
      process.env.TERMINAL_SHELL = '/bin/bash';
      const config = configuration();
      expect(config.terminal.shell).toBe('/bin/bash');
    });

    it('should use HOME as default allowedPath when not set', () => {
      delete process.env.TERMINAL_ALLOWED_PATH;
      process.env.HOME = '/home/testuser';
      const config = configuration();
      expect(config.terminal.allowedPath).toBe('/home/testuser');
    });

    it('should use TERMINAL_ALLOWED_PATH from environment variable', () => {
      process.env.TERMINAL_ALLOWED_PATH = '/custom/path';
      const config = configuration();
      expect(config.terminal.allowedPath).toBe('/custom/path');
    });

    it('should parse sessionTimeout as integer with default 30 minutes', () => {
      delete process.env.TERMINAL_SESSION_TIMEOUT;
      const config = configuration();
      expect(config.terminal.sessionTimeout).toBe(1800000); // 30 minutes in ms
    });

    it('should use custom sessionTimeout from environment', () => {
      process.env.TERMINAL_SESSION_TIMEOUT = '3600000'; // 60 minutes
      const config = configuration();
      expect(config.terminal.sessionTimeout).toBe(3600000);
    });

    it('should parse maxSessions as integer with default 10', () => {
      delete process.env.TERMINAL_MAX_SESSIONS;
      const config = configuration();
      expect(config.terminal.maxSessions).toBe(10);
    });

    it('should use custom maxSessions from environment', () => {
      process.env.TERMINAL_MAX_SESSIONS = '20';
      const config = configuration();
      expect(config.terminal.maxSessions).toBe(20);
    });

    it('should parse folder shortcuts from comma-separated string', () => {
      process.env.FOLDERS_SHORTCUTS = '/home/user,/var/www,/etc';
      const config = configuration();
      expect(config.terminal.folderShortcuts).toEqual(['/home/user', '/var/www', '/etc']);
    });

    it('should handle empty folder shortcuts', () => {
      process.env.FOLDERS_SHORTCUTS = '';
      const config = configuration();
      expect(config.terminal.folderShortcuts).toEqual([]);
    });

    it('should trim whitespace from folder shortcuts', () => {
      process.env.FOLDERS_SHORTCUTS = ' /home/user , /var/www , /etc ';
      const config = configuration();
      expect(config.terminal.folderShortcuts).toEqual(['/home/user', '/var/www', '/etc']);
    });

    it('should parse favorite commands from comma-separated string', () => {
      process.env.FAV_CMDS = 'npm start,npm test,git status';
      const config = configuration();
      expect(config.terminal.favoriteCommands).toEqual(['npm start', 'npm test', 'git status']);
    });

    it('should handle empty favorite commands', () => {
      process.env.FAV_CMDS = '';
      const config = configuration();
      expect(config.terminal.favoriteCommands).toEqual([]);
    });

    it('should trim whitespace from favorite commands', () => {
      process.env.FAV_CMDS = ' ls -la , pwd , cd .. ';
      const config = configuration();
      expect(config.terminal.favoriteCommands).toEqual(['ls -la', 'pwd', 'cd ..']);
    });
  });

  describe('session configuration', () => {
    it('should use default session secret when not set and log warning', () => {
      delete process.env.SESSION_SECRET;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config = configuration();
      expect(config.session.secret).toBe('INSECURE-DEFAULT-DO-NOT-USE-IN-PRODUCTION');
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️  WARNING: SESSION_SECRET is not set! Using insecure default. This is NOT safe for production!',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️  Generate a secure secret with: openssl rand -base64 32',
      );
      warnSpy.mockRestore();
    });

    it('should use SESSION_SECRET from environment variable', () => {
      process.env.SESSION_SECRET = 'my-custom-secret';
      const config = configuration();
      expect(config.session.secret).toBe('my-custom-secret');
    });
  });

  describe('auth configuration', () => {
    it('should have auth disabled by default', () => {
      delete process.env.AUTH_ENABLE;
      const config = configuration();
      expect(config.auth.enabled).toBe(false);
    });

    it('should enable auth when AUTH_ENABLE is true', () => {
      process.env.AUTH_ENABLE = 'true';
      const config = configuration();
      expect(config.auth.enabled).toBe(true);
    });

    it('should keep auth disabled for any value other than "true"', () => {
      process.env.AUTH_ENABLE = 'false';
      let config = configuration();
      expect(config.auth.enabled).toBe(false);

      process.env.AUTH_ENABLE = 'yes';
      config = configuration();
      expect(config.auth.enabled).toBe(false);
    });

    it('should parse allowed emails from comma-separated string', () => {
      process.env.AUTH_ALLOWED_EMAILS = 'user1@example.com,user2@example.com,user3@example.com';
      const config = configuration();
      expect(config.auth.allowedEmails).toEqual([
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ]);
    });

    it('should handle empty allowed emails', () => {
      process.env.AUTH_ALLOWED_EMAILS = '';
      const config = configuration();
      expect(config.auth.allowedEmails).toEqual([]);
    });

    it('should trim whitespace from allowed emails', () => {
      process.env.AUTH_ALLOWED_EMAILS = ' user1@example.com , user2@example.com ';
      const config = configuration();
      expect(config.auth.allowedEmails).toEqual(['user1@example.com', 'user2@example.com']);
    });

    it('should use static secret from environment', () => {
      process.env.AUTH_STATIC_SECRET = 'my-static-secret-123';
      const config = configuration();
      expect(config.auth.staticSecret).toBe('my-static-secret-123');
    });

    it('should have empty static secret by default', () => {
      delete process.env.AUTH_STATIC_SECRET;
      const config = configuration();
      expect(config.auth.staticSecret).toBe('');
    });
  });

  describe('google OAuth configuration', () => {
    it('should use empty strings as defaults', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_CALLBACK_URL;
      const config = configuration();
      expect(config.google.clientId).toBe('');
      expect(config.google.clientSecret).toBe('');
      expect(config.google.callbackURL).toBe('');
    });

    it('should use Google OAuth credentials from environment', () => {
      process.env.GOOGLE_CLIENT_ID = 'google-client-id-123';
      process.env.GOOGLE_CLIENT_SECRET = 'google-secret-456';
      process.env.GOOGLE_CALLBACK_URL = 'https://example.com/auth/google/callback';
      const config = configuration();
      expect(config.google.clientId).toBe('google-client-id-123');
      expect(config.google.clientSecret).toBe('google-secret-456');
      expect(config.google.callbackURL).toBe('https://example.com/auth/google/callback');
    });
  });

  describe('github OAuth configuration', () => {
    it('should use empty strings as defaults', () => {
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      delete process.env.GITHUB_CALLBACK_URL;
      const config = configuration();
      expect(config.github.clientId).toBe('');
      expect(config.github.clientSecret).toBe('');
      expect(config.github.callbackURL).toBe('');
    });

    it('should use GitHub OAuth credentials from environment', () => {
      process.env.GITHUB_CLIENT_ID = 'github-client-id-789';
      process.env.GITHUB_CLIENT_SECRET = 'github-secret-012';
      process.env.GITHUB_CALLBACK_URL = 'https://example.com/auth/github/callback';
      const config = configuration();
      expect(config.github.clientId).toBe('github-client-id-789');
      expect(config.github.clientSecret).toBe('github-secret-012');
      expect(config.github.callbackURL).toBe('https://example.com/auth/github/callback');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleOAuthCallback', () => {
    const validUser = {
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      provider: 'google',
    };

    it('should generate JWT token for valid user with allowed email', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return ['test@example.com'];
        return undefined;
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.handleOAuthCallback(validUser);

      expect(result).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: validUser.email,
        name: validUser.name,
        picture: validUser.picture,
        provider: validUser.provider,
      });
    });

    it('should throw error when user is null', async () => {
      await expect(service.handleOAuthCallback(null)).rejects.toThrow(
        'No user data received from OAuth provider',
      );
    });

    it('should throw error when user has no email', async () => {
      const userWithoutEmail = { name: 'Test User', provider: 'google' };

      await expect(service.handleOAuthCallback(userWithoutEmail)).rejects.toThrow(
        'No email received from OAuth provider',
      );
    });

    it('should throw error when authentication is disabled', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return false;
        return undefined;
      });

      await expect(service.handleOAuthCallback(validUser)).rejects.toThrow(
        'Authentication is disabled',
      );
    });

    it('should throw error when allowed emails list is empty', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return [];
        return undefined;
      });

      await expect(service.handleOAuthCallback(validUser)).rejects.toThrow(
        'Email allowlist is not configured',
      );
    });

    it('should throw error when allowed emails list is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return null;
        return undefined;
      });

      await expect(service.handleOAuthCallback(validUser)).rejects.toThrow(
        'Email allowlist is not configured',
      );
    });

    it('should throw ForbiddenException when email is not in allowed list', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return ['allowed@example.com'];
        return undefined;
      });

      await expect(service.handleOAuthCallback(validUser)).rejects.toThrow(ForbiddenException);
      await expect(service.handleOAuthCallback(validUser)).rejects.toThrow(
        'Email test@example.com is not in the allowed list',
      );
    });

    it('should handle multiple allowed emails', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails')
          return ['user1@example.com', 'test@example.com', 'user2@example.com'];
        return undefined;
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.handleOAuthCallback(validUser);

      expect(result).toBe('mock-jwt-token');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', async () => {
      const mockPayload = {
        email: 'test@example.com',
        name: 'Test User',
        provider: 'google',
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.verifyToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('handleStaticSecretAuth', () => {
    it('should generate JWT token for valid static secret', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.staticSecret') return 'correct-secret';
        return undefined;
      });
      mockJwtService.sign.mockReturnValue('static-secret-token');

      const result = await service.handleStaticSecretAuth('correct-secret');

      expect(result).toBe('static-secret-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'static-secret-user',
        name: 'Static Secret User',
        provider: 'static-secret',
      });
    });

    it('should throw error when authentication is disabled', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return false;
        return undefined;
      });

      await expect(service.handleStaticSecretAuth('any-secret')).rejects.toThrow(
        'Authentication is disabled',
      );
    });

    it('should throw UnauthorizedException when static secret is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.staticSecret') return '';
        return undefined;
      });

      await expect(service.handleStaticSecretAuth('any-secret')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.handleStaticSecretAuth('any-secret')).rejects.toThrow(
        'Static secret authentication is not configured',
      );
    });

    it('should throw UnauthorizedException for incorrect secret', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.staticSecret') return 'correct-secret';
        return undefined;
      });

      await expect(service.handleStaticSecretAuth('wrong-secret')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.handleStaticSecretAuth('wrong-secret')).rejects.toThrow(
        'Invalid secret',
      );
    });
  });

  describe('isStaticSecretConfigured', () => {
    it('should return true when static secret is configured', () => {
      mockConfigService.get.mockReturnValue('some-secret');

      const result = service.isStaticSecretConfigured();

      expect(result).toBe(true);
    });

    it('should return false when static secret is empty', () => {
      mockConfigService.get.mockReturnValue('');

      const result = service.isStaticSecretConfigured();

      expect(result).toBe(false);
    });

    it('should return false when static secret is only whitespace', () => {
      mockConfigService.get.mockReturnValue('   ');

      const result = service.isStaticSecretConfigured();

      expect(result).toBe(false);
    });

    it('should return false when static secret is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = service.isStaticSecretConfigured();

      expect(result).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true when authentication is disabled', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return false;
        return undefined;
      });

      const result = service.validateEmail('any@example.com');

      expect(result).toBe(true);
    });

    it('should return true when email is in allowed list', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return ['test@example.com', 'user@example.com'];
        return undefined;
      });

      const result = service.validateEmail('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email is not in allowed list', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return ['allowed@example.com'];
        return undefined;
      });

      const result = service.validateEmail('notallowed@example.com');

      expect(result).toBe(false);
    });

    it('should return false when allowed emails list is empty', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return [];
        return undefined;
      });

      const result = service.validateEmail('any@example.com');

      expect(result).toBe(false);
    });

    it('should return false when allowed emails list is not configured', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'auth.enabled') return true;
        if (key === 'auth.allowedEmails') return undefined;
        return undefined;
      });

      const result = service.validateEmail('any@example.com');

      expect(result).toBe(false);
    });
  });
});

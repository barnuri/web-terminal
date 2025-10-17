import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';

describe('UrlService', () => {
  let service: UrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrlService],
    }).compile();

    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setUrl and getUrl', () => {
    it('should store and retrieve a URL', () => {
      service.setUrl('test-key', 'https://example.com');
      const result = service.getUrl('test-key');
      expect(result).toBe('https://example.com');
    });

    it('should return null for non-existent key', () => {
      const result = service.getUrl('non-existent');
      expect(result).toBeNull();
    });

    it('should update existing URL', () => {
      service.setUrl('test-key', 'https://example.com');
      service.setUrl('test-key', 'https://updated.com');
      const result = service.getUrl('test-key');
      expect(result).toBe('https://updated.com');
    });

    it('should handle multiple different keys', () => {
      service.setUrl('key1', 'https://url1.com');
      service.setUrl('key2', 'https://url2.com');
      service.setUrl('key3', 'https://url3.com');

      expect(service.getUrl('key1')).toBe('https://url1.com');
      expect(service.getUrl('key2')).toBe('https://url2.com');
      expect(service.getUrl('key3')).toBe('https://url3.com');
    });
  });

  describe('getNgrokUrl and setNgrokUrl', () => {
    it('should store and retrieve ngrok URL', () => {
      service.setNgrokUrl('https://abc123.ngrok.io');
      const result = service.getNgrokUrl();
      expect(result).toBe('https://abc123.ngrok.io');
    });

    it('should return null when ngrok URL is not set', () => {
      const result = service.getNgrokUrl();
      expect(result).toBeNull();
    });

    it('should update ngrok URL', () => {
      service.setNgrokUrl('https://first.ngrok.io');
      service.setNgrokUrl('https://second.ngrok.io');
      const result = service.getNgrokUrl();
      expect(result).toBe('https://second.ngrok.io');
    });

    it('should use setUrl internally for ngrok', () => {
      service.setUrl('ngrok', 'https://manually-set.ngrok.io');
      const result = service.getNgrokUrl();
      expect(result).toBe('https://manually-set.ngrok.io');
    });
  });

  describe('getAllUrls', () => {
    it('should return empty object when no URLs are stored', () => {
      const result = service.getAllUrls();
      expect(result).toEqual({});
    });

    it('should return all stored URLs', () => {
      service.setUrl('key1', 'https://url1.com');
      service.setUrl('key2', 'https://url2.com');
      service.setNgrokUrl('https://ngrok.io');

      const result = service.getAllUrls();

      expect(result).toEqual({
        key1: 'https://url1.com',
        key2: 'https://url2.com',
        ngrok: 'https://ngrok.io',
      });
    });

    it('should return updated URLs after modification', () => {
      service.setUrl('test', 'https://old.com');
      service.setUrl('test', 'https://new.com');

      const result = service.getAllUrls();

      expect(result).toEqual({
        test: 'https://new.com',
      });
    });
  });

  describe('hasUrl', () => {
    it('should return false for non-existent key', () => {
      const result = service.hasUrl('non-existent');
      expect(result).toBe(false);
    });

    it('should return true for existing key', () => {
      service.setUrl('test-key', 'https://example.com');
      const result = service.hasUrl('test-key');
      expect(result).toBe(true);
    });

    it('should return true for ngrok key when set', () => {
      service.setNgrokUrl('https://ngrok.io');
      const result = service.hasUrl('ngrok');
      expect(result).toBe(true);
    });

    it('should work correctly after updating a URL', () => {
      service.setUrl('test', 'https://first.com');
      expect(service.hasUrl('test')).toBe(true);

      service.setUrl('test', 'https://second.com');
      expect(service.hasUrl('test')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty string URL (falsy value)', () => {
      service.setUrl('empty', '');
      // Empty string is falsy, so getUrl returns null due to || null logic
      expect(service.getUrl('empty')).toBeNull();
      expect(service.hasUrl('empty')).toBe(true);
    });

    it('should handle special characters in keys', () => {
      service.setUrl('key-with-dashes', 'https://example.com');
      service.setUrl('key_with_underscores', 'https://example2.com');
      service.setUrl('key.with.dots', 'https://example3.com');

      expect(service.getUrl('key-with-dashes')).toBe('https://example.com');
      expect(service.getUrl('key_with_underscores')).toBe('https://example2.com');
      expect(service.getUrl('key.with.dots')).toBe('https://example3.com');
    });

    it('should handle URLs with query parameters', () => {
      const urlWithParams = 'https://example.com?param1=value1&param2=value2';
      service.setUrl('complex-url', urlWithParams);
      expect(service.getUrl('complex-url')).toBe(urlWithParams);
    });

    it('should handle localhost URLs', () => {
      service.setUrl('local', 'http://localhost:3000');
      expect(service.getUrl('local')).toBe('http://localhost:3000');
    });
  });
});

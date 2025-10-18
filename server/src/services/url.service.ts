import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);
  private readonly urlDict: Map<string, string> = new Map();

  /**
   * Store a URL with a key
   */
  setUrl(key: string, url: string): void {
    this.urlDict.set(key, url);
    this.logger.log(`Stored URL for ${key}: ${url}`);
  }

  /**
   * Get a URL by key
   */
  getUrl(key: string): string | null {
    return this.urlDict.get(key) || null;
  }

  /**
   * Get the ngrok URL specifically
   */
  getNgrokUrl(): string | null {
    return this.getUrl('ngrok');
  }

  /**
   * Set the ngrok URL specifically
   */
  setNgrokUrl(url: string): void {
    this.setUrl('ngrok', url);
  }

  /**
   * Get all stored URLs
   */
  getAllUrls(): Record<string, string> {
    return Object.fromEntries(this.urlDict.entries());
  }

  /**
   * Check if a URL is stored for a key
   */
  hasUrl(key: string): boolean {
    return this.urlDict.has(key);
  }
}

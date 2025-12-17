import { describe, it, expect } from 'vitest';
import { WebScrapingService } from '../web-scraping-service';

describe('Video Platform Integration', () => {
  const webScrapingService = new WebScrapingService();

  describe('URL Support Detection', () => {
    it('should support YouTube URLs', () => {
      expect(webScrapingService.canHandle('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(webScrapingService.canHandle('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(webScrapingService.canHandle('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should support TikTok URLs', () => {
      expect(webScrapingService.canHandle('https://www.tiktok.com/@user/video/1234567890')).toBe(true);
      expect(webScrapingService.canHandle('https://vm.tiktok.com/ZMeAbCdEf')).toBe(true);
    });

    it('should support Instagram URLs', () => {
      expect(webScrapingService.canHandle('https://www.instagram.com/p/ABC123')).toBe(true);
      expect(webScrapingService.canHandle('https://instagram.com/reel/XYZ789')).toBe(true);
      expect(webScrapingService.canHandle('https://www.instagram.com/tv/DEF456')).toBe(true);
    });
  });

  describe('Supported Domains', () => {
    it('should include video platform domains', () => {
      const domains = webScrapingService.getSupportedDomains();
      
      // YouTube domains
      expect(domains).toContain('youtube.com');
      expect(domains).toContain('youtu.be');
      expect(domains).toContain('m.youtube.com');
      
      // TikTok domains
      expect(domains).toContain('tiktok.com');
      expect(domains).toContain('vm.tiktok.com');
      expect(domains).toContain('www.tiktok.com');
      
      // Instagram domains
      expect(domains).toContain('instagram.com');
      expect(domains).toContain('www.instagram.com');
    });
  });

  describe('Adapter Information', () => {
    it('should include video platform adapters', () => {
      const adapters = webScrapingService.getAdapterInfo();
      
      const adapterNames = adapters.map(a => a.name);
      expect(adapterNames).toContain('YouTubeAdapter');
      expect(adapterNames).toContain('TikTokAdapter');
      expect(adapterNames).toContain('InstagramAdapter');
      
      // Video adapters should come before general adapters
      const youtubeIndex = adapterNames.indexOf('YouTubeAdapter');
      const jsonLdIndex = adapterNames.indexOf('JsonLdAdapter');
      expect(youtubeIndex).toBeLessThan(jsonLdIndex);
    });
  });
});
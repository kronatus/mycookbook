import { describe, it, expect } from 'vitest';
import { YouTubeAdapter } from '../source-adapters/youtube-adapter';
import { TikTokAdapter } from '../source-adapters/tiktok-adapter';
import { InstagramAdapter } from '../source-adapters/instagram-adapter';

describe('Video Platform Adapters', () => {
  describe('YouTubeAdapter', () => {
    const adapter = new YouTubeAdapter();

    it('should identify YouTube URLs correctly', () => {
      expect(adapter.canHandle('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(adapter.canHandle('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(adapter.canHandle('https://youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
      expect(adapter.canHandle('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(adapter.canHandle('https://example.com')).toBe(false);
    });

    it('should return supported domains', () => {
      const domains = adapter.getSupportedDomains();
      expect(domains).toContain('youtube.com');
      expect(domains).toContain('youtu.be');
      expect(domains).toContain('m.youtube.com');
    });
  });

  describe('TikTokAdapter', () => {
    const adapter = new TikTokAdapter();

    it('should identify TikTok URLs correctly', () => {
      expect(adapter.canHandle('https://www.tiktok.com/@user/video/1234567890')).toBe(true);
      expect(adapter.canHandle('https://tiktok.com/@user/video/1234567890')).toBe(true);
      expect(adapter.canHandle('https://vm.tiktok.com/ZMeAbCdEf')).toBe(true);
      expect(adapter.canHandle('https://example.com')).toBe(false);
    });

    it('should return supported domains', () => {
      const domains = adapter.getSupportedDomains();
      expect(domains).toContain('tiktok.com');
      expect(domains).toContain('vm.tiktok.com');
      expect(domains).toContain('www.tiktok.com');
    });
  });

  describe('InstagramAdapter', () => {
    const adapter = new InstagramAdapter();

    it('should identify Instagram URLs correctly', () => {
      expect(adapter.canHandle('https://www.instagram.com/p/ABC123')).toBe(true);
      expect(adapter.canHandle('https://instagram.com/reel/XYZ789')).toBe(true);
      expect(adapter.canHandle('https://www.instagram.com/tv/DEF456')).toBe(true);
      expect(adapter.canHandle('https://example.com')).toBe(false);
    });

    it('should return supported domains', () => {
      const domains = adapter.getSupportedDomains();
      expect(domains).toContain('instagram.com');
      expect(domains).toContain('www.instagram.com');
    });
  });
});
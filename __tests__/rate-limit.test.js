/**
 * Unit Tests for Rate Limiting
 * Tests: shared/middleware/rate-limit.js
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { default as rateLimitModule } from '../shared/middleware/rate-limit.js';

const { rateLimiter, getClientIp } = rateLimitModule;

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  it('should allow requests within limit', () => {
    const result1 = rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(4);

    const result2 = rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(3);
  });

  it('should block requests exceeding limit', () => {
    // Make 5 requests (limit)
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    }

    // 6th request should be blocked
    const result = rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset counter after window expires', async () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 1000 });
    }

    // Should be blocked
    let result = rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 1000 });
    expect(result.allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should be allowed again
    result = rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 1000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should track different IPs separately', () => {
    rateLimiter.check('192.168.1.1', { maxRequests: 2, windowMs: 60000 });
    rateLimiter.check('192.168.1.1', { maxRequests: 2, windowMs: 60000 });

    // IP1 should be at limit
    let result = rateLimiter.check('192.168.1.1', { maxRequests: 2, windowMs: 60000 });
    expect(result.allowed).toBe(false);

    // IP2 should still be allowed
    result = rateLimiter.check('192.168.1.2', { maxRequests: 2, windowMs: 60000 });
    expect(result.allowed).toBe(true);
  });

  it('should reset specific IP', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    }

    rateLimiter.reset('192.168.1.1');

    const result = rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should return stats', () => {
    rateLimiter.check('192.168.1.1', { maxRequests: 5, windowMs: 60000 });
    rateLimiter.check('192.168.1.2', { maxRequests: 5, windowMs: 60000 });

    const stats = rateLimiter.stats();
    expect(stats.trackedIPs).toBe(2);
    expect(stats.ips).toContain('192.168.1.1');
    expect(stats.ips).toContain('192.168.1.2');
  });
});

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header (Vercel)', () => {
    const request = {
      headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' }
    };
    expect(getClientIp(request)).toBe('203.0.113.1');
  });

  it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
    const request = {
      headers: { 'cf-connecting-ip': '203.0.113.1' }
    };
    expect(getClientIp(request)).toBe('203.0.113.1');
  });

  it('should extract IP from x-real-ip header', () => {
    const request = {
      headers: { 'x-real-ip': '203.0.113.1' }
    };
    expect(getClientIp(request)).toBe('203.0.113.1');
  });

  it('should return unknown if no IP found', () => {
    const request = { headers: {} };
    expect(getClientIp(request)).toBe('unknown');
  });
});

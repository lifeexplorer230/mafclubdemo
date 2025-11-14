/**
 * Unit Tests for Cache Module
 * Tests: shared/cache.js
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import cache from '../shared/cache.js';

describe('Cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1', 60);
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBe(null);
  });

  it('should expire values after TTL', async () => {
    cache.set('key1', 'value1', 1); // 1 second TTL
    expect(cache.get('key1')).toBe('value1');

    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(cache.get('key1')).toBe(null);
  });

  it('should delete values', () => {
    cache.set('key1', 'value1', 60);
    expect(cache.get('key1')).toBe('value1');

    cache.delete('key1');
    expect(cache.get('key1')).toBe(null);
  });

  it('should clear all values', () => {
    cache.set('key1', 'value1', 60);
    cache.set('key2', 'value2', 60);

    cache.clear();
    expect(cache.get('key1')).toBe(null);
    expect(cache.get('key2')).toBe(null);
  });

  it('should cleanup expired entries', async () => {
    cache.set('key1', 'value1', 1); // 1 second TTL
    cache.set('key2', 'value2', 60); // 60 seconds TTL

    await new Promise(resolve => setTimeout(resolve, 1100));

    cache.cleanup();
    expect(cache.get('key1')).toBe(null);
    expect(cache.get('key2')).toBe('value2');
  });

  it('should return stats', () => {
    cache.set('key1', 'value1', 60);
    cache.set('key2', 'value2', 60);

    const stats = cache.stats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toContain('key1');
    expect(stats.keys).toContain('key2');
  });

  it('should store complex objects', () => {
    const obj = { name: 'Test', points: 100, roles: ['admin', 'user'] };
    cache.set('obj', obj, 60);

    const retrieved = cache.get('obj');
    expect(retrieved).toEqual(obj);
  });
});

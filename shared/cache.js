/**
 * Simple In-Memory Cache
 * Performance: Reduces database load by caching frequently accessed data
 *
 * Note: В production на Vercel это будет работать только в рамках одной Lambda функции
 * Для полноценного caching лучше использовать Redis или Vercel KV
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map(); // Time To Live для каждого ключа
  }

  /**
   * Сохраняет значение в кеш
   * @param {string} key - Ключ кеша
   * @param {any} value - Значение для сохранения
   * @param {number} ttl - Time To Live в секундах (по умолчанию 60)
   */
  set(key, value, ttl = 60) {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + ttl * 1000);
  }

  /**
   * Получает значение из кеша
   * @param {string} key - Ключ кеша
   * @returns {any|null} Значение или null если не найдено/истекло
   */
  get(key) {
    // Проверяем наличие ключа
    if (!this.cache.has(key)) {
      return null;
    }

    // Проверяем TTL
    const expiresAt = this.ttls.get(key);
    if (Date.now() > expiresAt) {
      // Кеш истёк
      this.cache.delete(key);
      this.ttls.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Удаляет значение из кеша
   * @param {string} key - Ключ кеша
   */
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  /**
   * Очищает весь кеш
   */
  clear() {
    this.cache.clear();
    this.ttls.clear();
  }

  /**
   * Удаляет истёкшие записи
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiresAt] of this.ttls.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
        this.ttls.delete(key);
      }
    }
  }

  /**
   * Возвращает статистику кеша
   * @returns {Object} Статистика
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const cache = new SimpleCache();

// Периодическая очистка истёкших записей (каждые 5 минут)
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export default cache;

/**
 * Cache Middleware для API endpoints
 *
 * @param {number} ttl - Time To Live в секундах
 * @returns {Function} Middleware function
 *
 * @example
 * import { cacheMiddleware } from '../shared/cache.js';
 *
 * export default async function handler(request, response) {
 *   // Cache for 60 seconds
 *   const cached = cacheMiddleware(60)(request, response);
 *   if (cached) return cached;
 *
 *   // Your API logic here
 *   const data = await fetchData();
 *   return response.status(200).json(data);
 * }
 */
export function cacheMiddleware(ttl = 60) {
  return (request, response) => {
    // Генерируем ключ кеша из URL + query params
    const cacheKey = `${request.url}`;

    // Проверяем кеш
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      // Добавляем заголовок X-Cache-Hit
      response.setHeader('X-Cache', 'HIT');
      response.setHeader('X-Cache-TTL', ttl);
      return response.status(200).json(cachedData);
    }

    // Кеша нет - оборачиваем response.json для сохранения в кеш
    const originalJson = response.json.bind(response);
    response.json = function(data) {
      // Сохраняем только успешные ответы (2xx)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
        response.setHeader('X-Cache', 'MISS');
        response.setHeader('X-Cache-TTL', ttl);
      }
      return originalJson(data);
    };

    return null; // Продолжить выполнение handler
  };
}

/**
 * Invalidates cache by key pattern
 * @param {string|RegExp} pattern - Ключ или regex паттерн
 */
export function invalidateCache(pattern) {
  if (typeof pattern === 'string') {
    cache.delete(pattern);
  } else if (pattern instanceof RegExp) {
    const keys = Array.from(cache.cache.keys());
    keys.forEach(key => {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    });
  }
}

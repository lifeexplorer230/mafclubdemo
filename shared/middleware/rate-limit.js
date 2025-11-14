/**
 * Rate Limiting Middleware
 * Security & Performance: Prevents abuse and DoS attacks
 *
 * Использует Token Bucket algorithm
 * Note: В production на Vercel это работает только в рамках одной Lambda функции
 * Для полноценного rate limiting лучше использовать Redis или Vercel KV
 */

class RateLimiter {
  constructor() {
    this.requests = new Map(); // IP -> {count, resetAt}
    this.cleanupInterval = null;

    // Периодическая очистка устаревших записей
    this.startCleanup();
  }

  /**
   * Проверяет лимит запросов для IP
   * @param {string} ip - IP адрес клиента
   * @param {Object} options - Опции лимита
   * @param {number} options.maxRequests - Максимальное количество запросов
   * @param {number} options.windowMs - Временное окно в миллисекундах
   * @returns {Object} {allowed: boolean, remaining: number, resetAt: number}
   */
  check(ip, options = {}) {
    const { maxRequests = 100, windowMs = 60000 } = options; // По умолчанию: 100 req/min

    const now = Date.now();
    const record = this.requests.get(ip);

    // Первый запрос от этого IP
    if (!record) {
      this.requests.set(ip, {
        count: 1,
        resetAt: now + windowMs
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs
      };
    }

    // Окно истекло - сбрасываем счётчик
    if (now > record.resetAt) {
      this.requests.set(ip, {
        count: 1,
        resetAt: now + windowMs
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs
      };
    }

    // Увеличиваем счётчик
    record.count++;

    // Проверяем лимит
    if (record.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetAt: record.resetAt
    };
  }

  /**
   * Сбрасывает лимит для IP
   * @param {string} ip - IP адрес
   */
  reset(ip) {
    this.requests.delete(ip);
  }

  /**
   * Очищает все лимиты
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Запускает периодическую очистку устаревших записей
   */
  startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.requests.entries()) {
        if (now > record.resetAt + 60000) { // +1 минута после истечения
          this.requests.delete(ip);
        }
      }
    }, 60000); // Каждую минуту
  }

  /**
   * Останавливает периодическую очистку
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Возвращает статистику
   * @returns {Object}
   */
  stats() {
    return {
      trackedIPs: this.requests.size,
      ips: Array.from(this.requests.keys())
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Извлекает IP адрес из request
 * Учитывает заголовки прокси (Vercel, Cloudflare, etc.)
 * @param {Object} request - HTTP request
 * @returns {string} IP адрес
 */
function getClientIp(request) {
  // Vercel forwards client IP in x-forwarded-for header
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = request.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Other headers
  const xRealIp = request.headers['x-real-ip'];
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback to connection IP (не всегда доступно в serverless)
  return request.socket?.remoteAddress || 'unknown';
}

/**
 * Rate Limiting Middleware
 *
 * @param {Object} options - Опции лимита
 * @param {number} options.maxRequests - Максимальное количество запросов
 * @param {number} options.windowMs - Временное окно в миллисекундах
 * @returns {Function} Middleware function
 *
 * @example
 * import { rateLimitMiddleware } from '../shared/middleware/rate-limit.js';
 *
 * export default async function handler(request, response) {
 *   // Limit: 10 requests per minute
 *   if (rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 })(request, response)) {
 *     return; // Rate limit exceeded
 *   }
 *
 *   // Your API logic here
 * }
 */
export function rateLimitMiddleware(options = {}) {
  return (request, response) => {
    const ip = getClientIp(request);
    const result = rateLimiter.check(ip, options);

    // Добавляем заголовки rate limit info
    response.setHeader('X-RateLimit-Limit', options.maxRequests || 100);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      response.setHeader('Retry-After', retryAfter);

      response.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter: retryAfter
      });

      return true; // Блокируем запрос
    }

    return false; // Продолжить выполнение
  };
}

export default {
  rateLimitMiddleware,
  rateLimiter,
  getClientIp
};

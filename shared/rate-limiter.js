/**
 * Rate Limiter Middleware
 * Phase 2: Performance Optimization
 *
 * Protects API endpoints from abuse with:
 * - IP-based rate limiting
 * - Sliding window algorithm
 * - Configurable limits per endpoint
 * - 429 Too Many Requests response
 */

// In-memory storage for rate limit counters
// In production, consider using Redis for distributed systems
const requestCounts = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 60000 * 10) { // 10 minutes old
      requestCounts.delete(key);
    }
  }
}, 60000 * 5);

/**
 * Rate limiter configuration
 */
const DEFAULT_CONFIG = {
  windowMs: 60000,      // 1 minute
  maxRequests: 100,     // 100 requests per window
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

/**
 * Per-endpoint configurations
 */
const ENDPOINT_CONFIGS = {
  '/api/auth': {
    windowMs: 60000,
    maxRequests: 10,    // Strict limit for auth endpoint
    message: 'Too many authentication attempts. Please wait before trying again.'
  },
  '/api/rating': {
    windowMs: 60000,
    maxRequests: 60
  },
  '/api/players': {
    windowMs: 60000,
    maxRequests: 60
  },
  '/api/games': {
    windowMs: 60000,
    maxRequests: 60
  },
  '/api/day-stats': {
    windowMs: 60000,
    maxRequests: 30
  },
  '/api/day-games': {
    windowMs: 60000,
    maxRequests: 30
  },
  '/api/version': {
    windowMs: 60000,
    maxRequests: 200    // More lenient for version checks
  }
};

/**
 * Gets client identifier (IP address)
 * @param {Request} request - Vercel request object
 * @returns {string} Client identifier
 */
function getClientId(request) {
  // Try different headers in order of preference
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  return ip.trim();
}

/**
 * Gets rate limit configuration for endpoint
 * @param {string} pathname - Request pathname
 * @returns {Object} Rate limit config
 */
function getConfig(pathname) {
  return {
    ...DEFAULT_CONFIG,
    ...(ENDPOINT_CONFIGS[pathname] || {})
  };
}

/**
 * Checks if request exceeds rate limit
 * @param {string} key - Rate limit key (clientId:endpoint)
 * @param {Object} config - Rate limit configuration
 * @returns {Object} Rate limit status
 */
function checkRateLimit(key, config) {
  const now = Date.now();
  let record = requestCounts.get(key);

  // Initialize or reset if window expired
  if (!record || now - record.startTime >= config.windowMs) {
    record = {
      count: 0,
      startTime: now,
      resetTime: now + config.windowMs
    };
    requestCounts.set(key, record);
  }

  // Increment request count
  record.count++;

  const remaining = Math.max(0, config.maxRequests - record.count);
  const isLimited = record.count > config.maxRequests;

  return {
    limit: config.maxRequests,
    current: record.count,
    remaining,
    resetTime: record.resetTime,
    isLimited
  };
}

/**
 * Rate limiter middleware for Vercel serverless functions
 * @param {Object} options - Rate limiter options
 * @returns {Function} Middleware function
 */
export function createRateLimiter(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  return async function rateLimiter(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Get endpoint-specific config
    const endpointConfig = getConfig(pathname);

    // Get client identifier
    const clientId = getClientId(request);

    // Create rate limit key
    const key = `${clientId}:${pathname}`;

    // Check rate limit
    const status = checkRateLimit(key, endpointConfig);

    // Prepare rate limit headers
    const headers = {
      'X-RateLimit-Limit': status.limit.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(status.resetTime / 1000).toString()
    };

    // If rate limited, return 429 response
    if (status.isLimited) {
      return new Response(
        JSON.stringify({
          error: endpointConfig.message || config.message,
          retryAfter: Math.ceil((status.resetTime - Date.now()) / 1000)
        }),
        {
          status: endpointConfig.statusCode || config.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((status.resetTime - Date.now()) / 1000).toString(),
            ...headers
          }
        }
      );
    }

    // Return status for successful check
    return { headers, status };
  };
}

/**
 * Simple rate limiter wrapper for API endpoints
 * @param {Function} handler - Original API handler
 * @param {Object} options - Rate limiter options
 * @returns {Function} Wrapped handler
 */
export function withRateLimit(handler, options = {}) {
  const rateLimiter = createRateLimiter(options);

  return async function (request) {
    // Check rate limit
    const limitResult = await rateLimiter(request);

    // If Response object, rate limit exceeded
    if (limitResult instanceof Response) {
      return limitResult;
    }

    // Call original handler with rate limit headers
    const response = await handler(request);

    // Add rate limit headers to response
    if (response && typeof response === 'object') {
      const headers = new Headers(response.headers || {});

      Object.entries(limitResult.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers
      });
    }

    return response;
  };
}

/**
 * Gets current rate limit stats for monitoring
 * @returns {Object} Rate limit statistics
 */
export function getRateLimitStats() {
  const now = Date.now();
  const stats = {
    totalKeys: requestCounts.size,
    activeWindows: 0,
    expiredWindows: 0,
    topClients: []
  };

  const clientCounts = new Map();

  for (const [key, data] of requestCounts.entries()) {
    const [clientId] = key.split(':');

    if (now - data.startTime < data.resetTime - data.startTime) {
      stats.activeWindows++;
    } else {
      stats.expiredWindows++;
    }

    // Aggregate by client
    const current = clientCounts.get(clientId) || 0;
    clientCounts.set(clientId, current + data.count);
  }

  // Get top 10 clients by request count
  stats.topClients = Array.from(clientCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([clientId, count]) => ({ clientId, requestCount: count }));

  return stats;
}

/**
 * Resets rate limit for specific client (admin function)
 * @param {string} clientId - Client identifier
 */
export function resetRateLimit(clientId) {
  let count = 0;
  for (const key of requestCounts.keys()) {
    if (key.startsWith(clientId + ':')) {
      requestCounts.delete(key);
      count++;
    }
  }
  return count;
}

/**
 * Clears all rate limit data (use with caution)
 */
export function clearAllRateLimits() {
  const count = requestCounts.size;
  requestCounts.clear();
  return count;
}

// Export for testing
export { requestCounts };

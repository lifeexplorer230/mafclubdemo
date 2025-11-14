/**
 * Example API endpoint with rate limiting
 * Shows how to integrate rate limiter into existing endpoints
 */

import { withRateLimit } from '../shared/rate-limiter.js';

/**
 * Original API handler (without rate limiting)
 */
async function handler(request) {
  return new Response(
    JSON.stringify({
      message: 'Success',
      data: { example: 'This endpoint is rate limited' }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Export handler with rate limiting
 * This automatically applies rate limits based on endpoint configuration
 */
export default withRateLimit(handler);

/**
 * USAGE EXAMPLES:
 *
 * 1. Use default configuration:
 *    export default withRateLimit(handler);
 *
 * 2. Custom configuration for this endpoint:
 *    export default withRateLimit(handler, {
 *      windowMs: 60000,
 *      maxRequests: 50,
 *      message: 'Custom rate limit message'
 *    });
 *
 * 3. Very strict limits (e.g., for auth):
 *    export default withRateLimit(handler, {
 *      windowMs: 60000,
 *      maxRequests: 5,
 *      message: 'Too many authentication attempts'
 *    });
 *
 * 4. Lenient limits (e.g., for public data):
 *    export default withRateLimit(handler, {
 *      windowMs: 60000,
 *      maxRequests: 200
 *    });
 */

/**
 * RESPONSE HEADERS:
 *
 * All responses include rate limit headers:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 *
 * When rate limited (429 response):
 * - Retry-After: Seconds to wait before retrying
 */

/**
 * CLIENT-SIDE HANDLING:
 *
 * Example JavaScript fetch with rate limit handling:
 *
 * async function fetchWithRateLimit(url) {
 *   const response = await fetch(url);
 *
 *   // Check rate limit headers
 *   const limit = response.headers.get('X-RateLimit-Limit');
 *   const remaining = response.headers.get('X-RateLimit-Remaining');
 *   const reset = response.headers.get('X-RateLimit-Reset');
 *
 *   console.log(`Rate limit: ${remaining}/${limit} remaining`);
 *
 *   // Handle rate limit exceeded
 *   if (response.status === 429) {
 *     const retryAfter = response.headers.get('Retry-After');
 *     console.log(`Rate limited. Retry after ${retryAfter} seconds`);
 *
 *     // Wait and retry
 *     await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
 *     return fetchWithRateLimit(url);
 *   }
 *
 *   return response.json();
 * }
 */

/**
 * CORS Middleware для защиты API endpoints
 *
 * Ограничивает доступ к API только с разрешенных доменов.
 * Предотвращает CSRF атаки.
 */

const ALLOWED_ORIGINS = [
    'https://score.mafclub.biz',
    'https://www.mafclub.biz',
    'https://mafclubscore.vercel.app' // Vercel production
];

// Разрешённые паттерны для preview deployments (используем regex для безопасности)
const ALLOWED_PREVIEW_PATTERNS = [
    /^https:\/\/mafclubscore-[a-z0-9]+-lifeexplorers-projects\.vercel\.app$/, // Vercel preview deployments
    /^https?:\/\/localhost:\d+$/, // Localhost для разработки
    /^https?:\/\/127\.0\.0\.1:\d+$/ // 127.0.0.1 для разработки
];

/**
 * Устанавливает CORS заголовки для запроса
 *
 * @param {Object} request - HTTP запрос
 * @param {Object} response - HTTP ответ
 * @returns {boolean} true если это был OPTIONS preflight запрос
 */
export function setCorsHeaders(request, response) {
    const origin = request.headers.origin || request.headers.Origin;

    // ✅ Security: Strict origin validation
    if (ALLOWED_ORIGINS.includes(origin)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin && isOriginMatchingPattern(origin)) {
        // ✅ Security: Check against specific regex patterns
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Установить остальные CORS заголовки
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Max-Age', '86400'); // 24 часа

    // Для OPTIONS preflight запросов
    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return true; // Сигнал что preflight обработан
    }

    return false; // Продолжить обработку обычного запроса
}

/**
 * Проверяет соответствие origin разрешённым паттернам
 * @param {string} origin - Origin для проверки
 * @returns {boolean}
 */
function isOriginMatchingPattern(origin) {
    return ALLOWED_PREVIEW_PATTERNS.some(pattern => pattern.test(origin));
}

/**
 * Проверяет разрешен ли origin
 * Используется для логирования и мониторинга
 */
export function isOriginAllowed(origin) {
    if (!origin) return false;

    // ✅ Security: Check against whitelist first
    if (ALLOWED_ORIGINS.includes(origin)) return true;

    // ✅ Security: Check against specific regex patterns
    if (isOriginMatchingPattern(origin)) return true;

    return false;
}

/**
 * Middleware wrapper для удобного использования
 *
 * @example
 * import { corsMiddleware } from './middleware/cors.js';
 *
 * export default function handler(req, res) {
 *     if (corsMiddleware(req, res)) return; // Preflight handled
 *
 *     // Your API logic here
 * }
 */
export function corsMiddleware(request, response) {
    const isPreflightHandled = setCorsHeaders(request, response);
    return isPreflightHandled;
}

// Default export
export default {
    setCorsHeaders,
    isOriginAllowed,
    corsMiddleware,
    ALLOWED_ORIGINS // Для тестирования
};

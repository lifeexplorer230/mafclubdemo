// API endpoint: POST /api/auth/verify
// Проверка действительности токена

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Получаем токен из заголовка или тела запроса
    let token = request.headers.get('Authorization');
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    } else {
      const body = await request.json();
      token = body.token;
    }

    if (!token) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Токен не предоставлен'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Проверяем формат токена (UUID-timestamp)
    const parts = token.split('-');
    if (parts.length < 2) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Неверный формат токена'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Извлекаем timestamp
    const timestamp = parseInt(parts[parts.length - 1]);
    if (isNaN(timestamp)) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Неверный формат токена'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Проверяем срок действия (7 дней)
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - timestamp > sevenDays) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Токен истёк'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Токен действителен
    return new Response(JSON.stringify({
      valid: true,
      username: 'Egor',
      expiresAt: timestamp + sevenDays
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(JSON.stringify({
      valid: false,
      error: 'Ошибка проверки токена',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

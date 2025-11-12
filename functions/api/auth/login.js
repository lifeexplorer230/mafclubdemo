// API endpoint: POST /api/auth/login
// Авторизация оператора

// Учётные данные
const VALID_CREDENTIALS = {
  username: 'Egor',
  password: 'unnatov14'
};

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Получаем данные
    const { username, password } = await request.json();

    // Проверяем учётные данные
    if (username === VALID_CREDENTIALS.username &&
        password === VALID_CREDENTIALS.password) {

      // Создаём простой токен (UUID + timestamp)
      const token = crypto.randomUUID() + '-' + Date.now();

      return new Response(JSON.stringify({
        success: true,
        token: token,
        username: username,
        expiresIn: '7 days'
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // Неверные учётные данные
      return new Response(JSON.stringify({
        success: false,
        error: 'Неверный логин или пароль'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Ошибка авторизации',
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

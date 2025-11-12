// API endpoint: GET /api/sessions/:id
// Получение статистики по конкретной игровой сессии

export async function onRequestGet(context) {
  const { params, env } = context;
  const sessionId = params.id;

  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const db = env.DB;

    // Получаем информацию о сессии
    const session = await db.prepare(`
      SELECT * FROM game_sessions WHERE id = ?
    `).bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({
        error: 'Сессия не найдена'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Получаем игры в сессии
    const games = await db.prepare(`
      SELECT * FROM games WHERE session_id = ?
      ORDER BY game_number
    `).bind(sessionId).all();

    // Получаем лучшего игрока дня (по средним очкам: очки / выигрыши)
    const bestPlayer = await db.prepare(`
      SELECT
        p.id,
        p.name,
        SUM(gr.points) as total_points,
        SUM(CASE WHEN gr.points > 0 THEN 1 ELSE 0 END) as wins,
        COUNT(gr.id) as games_played,
        CAST(SUM(gr.points) AS REAL) / NULLIF(SUM(CASE WHEN gr.points > 0 THEN 1 ELSE 0 END), 0) as avg_points_per_win
      FROM players p
      JOIN game_results gr ON p.id = gr.player_id
      JOIN games g ON gr.game_id = g.id
      WHERE g.session_id = ?
      GROUP BY p.id, p.name
      HAVING wins > 0
      ORDER BY avg_points_per_win DESC
      LIMIT 1
    `).bind(sessionId).first();

    // Получаем всех участников сессии
    const participants = await db.prepare(`
      SELECT
        p.id,
        p.name,
        SUM(gr.points) as total_points,
        SUM(CASE WHEN gr.points > 0 THEN 1 ELSE 0 END) as wins,
        COUNT(gr.id) as games_played,
        CAST(SUM(gr.points) AS REAL) / NULLIF(SUM(CASE WHEN gr.points > 0 THEN 1 ELSE 0 END), 0) as avg_points_per_win
      FROM players p
      JOIN game_results gr ON p.id = gr.player_id
      JOIN games g ON gr.game_id = g.id
      WHERE g.session_id = ?
      GROUP BY p.id, p.name
      ORDER BY avg_points_per_win DESC
    `).bind(sessionId).all();

    const result = {
      session: {
        id: session.id,
        date: session.date,
        total_games: session.total_games,
        created_at: session.created_at
      },
      games: games.results,
      best_player: bestPlayer ? {
        id: bestPlayer.id,
        name: bestPlayer.name,
        total_points: bestPlayer.total_points,
        wins: bestPlayer.wins,
        games_played: bestPlayer.games_played,
        avg_points_per_win: bestPlayer.avg_points_per_win ? parseFloat(bestPlayer.avg_points_per_win.toFixed(2)) : 0
      } : null,
      participants: participants.results.map(p => ({
        id: p.id,
        name: p.name,
        total_points: p.total_points,
        wins: p.wins,
        games_played: p.games_played,
        avg_points_per_win: p.avg_points_per_win ? parseFloat(p.avg_points_per_win.toFixed(2)) : 0
      }))
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error getting session:', error);
    return new Response(JSON.stringify({
      error: 'Ошибка получения данных',
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

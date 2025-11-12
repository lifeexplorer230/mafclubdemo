// API endpoint: POST /api/sessions
// Сохранение игровой сессии

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // CORS headers
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
    const sessionData = await request.json();

    // Валидация
    if (!sessionData.date || !sessionData.games || !Array.isArray(sessionData.games)) {
      return new Response(JSON.stringify({
        error: 'Неверный формат данных'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const db = env.DB; // D1 база данных

    // Начинаем транзакцию
    // 1. Создаём игровую сессию
    const sessionResult = await db.prepare(
      'INSERT INTO game_sessions (date, total_games) VALUES (?, ?)'
    ).bind(sessionData.date, sessionData.games.length).run();

    const sessionId = sessionResult.meta.last_row_id;

    // 2. Сохраняем каждую игру
    for (const game of sessionData.games) {
      // Создаём игру
      const gameResult = await db.prepare(
        'INSERT INTO games (session_id, game_number, winner, is_clean_win, is_dry_win) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        sessionId,
        game.game_number,
        game.winner,
        game.is_clean_win ? 1 : 0,
        game.is_dry_win ? 1 : 0
      ).run();

      const gameId = gameResult.meta.last_row_id;

      // 3. Сохраняем результаты игроков
      for (const result of game.results) {
        // Получаем или создаём игрока
        let player = await db.prepare(
          'SELECT id FROM players WHERE name = ?'
        ).bind(result.player_name).first();

        let playerId;
        if (!player) {
          const playerResult = await db.prepare(
            'INSERT INTO players (name) VALUES (?)'
          ).bind(result.player_name).run();
          playerId = playerResult.meta.last_row_id;
        } else {
          playerId = player.id;
        }

        // Сохраняем результат игрока
        await db.prepare(
          `INSERT INTO game_results
           (game_id, player_id, role, death_time, is_alive, points, black_checks, red_checks, achievements)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          gameId,
          playerId,
          result.role,
          result.death_time,
          result.is_alive ? 1 : 0,
          result.points,
          result.black_checks || 0,
          result.red_checks || 0,
          JSON.stringify(result.achievements || [])
        ).run();
      }
    }

    // 4. Вычисляем лучшего игрока дня (по средним очкам: очки / выигрыши)
    const bestPlayerQuery = await db.prepare(`
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

    const bestPlayer = bestPlayerQuery ? {
      name: bestPlayerQuery.name,
      total_points: bestPlayerQuery.total_points,
      wins: bestPlayerQuery.wins,
      games_played: bestPlayerQuery.games_played,
      avg_points_per_win: bestPlayerQuery.avg_points_per_win ? parseFloat(bestPlayerQuery.avg_points_per_win.toFixed(2)) : 0
    } : null;

    return new Response(JSON.stringify({
      success: true,
      session_id: sessionId,
      games_saved: sessionData.games.length,
      best_player_of_day: bestPlayer
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error saving session:', error);
    return new Response(JSON.stringify({
      error: 'Ошибка сохранения данных',
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

import { createClient } from '@libsql/client/web';

function getDB() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { date } = request.query;

  if (!date) {
    return response.status(400).json({ error: 'Date parameter required' });
  }

  try {
    const db = getDB();

    const sessionQuery = await db.execute({
      sql: 'SELECT id FROM game_sessions WHERE date = ?',
      args: [date]
    });

    if (sessionQuery.rows.length === 0) {
      return response.status(404).json({ error: 'No games for this date' });
    }

    const sessionId = sessionQuery.rows[0].id;

    const gamesQuery = await db.execute({
      sql: `SELECT * FROM games WHERE session_id = ? ORDER BY game_number ASC`,
      args: [sessionId]
    });

    const gamesWithPlayers = [];

    for (const game of gamesQuery.rows) {
      const playersQuery = await db.execute({
        sql: `
          SELECT
            gr.*,
            p.name as player_name
          FROM game_results gr
          JOIN players p ON gr.player_id = p.id
          WHERE gr.game_id = ?
          ORDER BY gr.id ASC
        `,
        args: [game.id]
      });

      const players = playersQuery.rows.map(row => ({
        ...row,
        achievements: row.achievements ? JSON.parse(row.achievements) : []
      }));

      gamesWithPlayers.push({
        game: game,
        players: players
      });
    }

    return response.status(200).json({
      success: true,
      date: date,
      games: gamesWithPlayers
    });
  } catch (error) {
    console.error('Day Games API Error:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}

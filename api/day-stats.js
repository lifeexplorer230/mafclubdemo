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

  try {
    const db = getDB();

    const query = `
      SELECT
        gs.date,
        gs.total_games,
        COUNT(DISTINCT gr.player_id) as total_players,
        COALESCE(SUM(gr.points), 0) as total_points
      FROM game_sessions gs
      LEFT JOIN games g ON gs.id = g.session_id
      LEFT JOIN game_results gr ON g.id = gr.game_id
      GROUP BY gs.id, gs.date, gs.total_games
      ORDER BY gs.date DESC
    `;

    const result = await db.execute(query);
    return response.status(200).json({
      success: true,
      days: result.rows
    });
  } catch (error) {
    console.error('Day Stats API Error:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}

/**
 * Day Stats API Endpoint
 * Phase 2.1: Refactored to use shared utilities
 */

import { getDB } from '../shared/database.js';
import { handleError, sendSuccess } from '../shared/handlers.js';
import { corsMiddleware } from '../shared/middleware/cors.js';

export default async function handler(request, response) {
  // CORS protection
  if (corsMiddleware(request, response)) return;

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

    // Для каждого дня получаем топ-3 игроков
    const daysWithTopPlayers = await Promise.all(
      result.rows.map(async (day) => {
        const topPlayersQuery = await db.execute({
          sql: `
            SELECT
              p.id,
              p.name,
              COUNT(*) as games_played,
              COALESCE(SUM(gr.points), 0) as total_points,
              ROUND(CAST(SUM(gr.points) AS REAL) / COUNT(*), 2) as avg_points
            FROM game_results gr
            JOIN players p ON gr.player_id = p.id
            JOIN games g ON gr.game_id = g.id
            JOIN game_sessions gs ON g.session_id = gs.id
            WHERE gs.date = ?
            GROUP BY p.id, p.name
            HAVING COUNT(*) >= 3
            ORDER BY avg_points DESC
            LIMIT 3
          `,
          args: [day.date]
        });

        return {
          ...day,
          top_players: topPlayersQuery.rows
        };
      })
    );

    return sendSuccess(response, { days: daysWithTopPlayers });
  } catch (error) {
    return handleError(response, error, 'Day Stats API Error');
  }
}

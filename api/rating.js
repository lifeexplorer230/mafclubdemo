/**
 * Rating API Endpoint
 * Phase 2.1: Refactored to use shared utilities
 */

import { getDB } from '../shared/database.js';
import { handleError, sendSuccess } from '../shared/handlers.js';
import { corsMiddleware } from './middleware/cors.js';

export default async function handler(request, response) {
  // CORS protection - only allow requests from allowed origins
  if (corsMiddleware(request, response)) return; // Preflight handled

  try {
    const db = getDB();

    const query = `
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT gr.game_id) as games_played,
        COALESCE(SUM(gr.points), 0) as total_points,
        SUM(CASE
          WHEN (g.winner = 'Мирные' AND gr.role IN ('Мирный', 'Шериф'))
            OR (g.winner = 'Мафия' AND gr.role IN ('Мафия', 'Дон'))
          THEN 1 ELSE 0
        END) as wins
      FROM players p
      LEFT JOIN game_results gr ON p.id = gr.player_id
      LEFT JOIN games g ON gr.game_id = g.id
      GROUP BY p.id, p.name
      HAVING games_played > 0
      ORDER BY total_points DESC
    `;

    const result = await db.execute(query);

    return sendSuccess(response, { players: result.rows });
  } catch (error) {
    return handleError(response, error, 'Rating API Error');
  }
}

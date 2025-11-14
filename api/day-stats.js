/**
 * Day Stats API Endpoint
 * Phase 2.1: Refactored to use shared utilities
 */

import { getDB } from '../shared/database.js';
import { handleError, sendSuccess } from '../shared/handlers.js';
import { corsMiddleware } from './middleware/cors.js';

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
    return sendSuccess(response, { days: result.rows });
  } catch (error) {
    return handleError(response, error, 'Day Stats API Error');
  }
}

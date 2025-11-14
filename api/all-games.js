/**
 * All Games API Endpoint
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

    const result = await db.execute(`
      SELECT g.id, g.game_number, gs.date, g.winner
      FROM games g
      LEFT JOIN game_sessions gs ON g.session_id = gs.id
      ORDER BY g.game_number ASC
    `);

    return sendSuccess(response, { games: result.rows });
  } catch (error) {
    return handleError(response, error, 'All Games API Error');
  }
}

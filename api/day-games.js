/**
 * Day Games API Endpoint
 * Phase 2.1: Refactored to use shared utilities
 */

import { getDB } from '../shared/database.js';
import { handleError, sendSuccess, sendNotFound, parseAchievements } from '../shared/handlers.js';
import { corsMiddleware } from './middleware/cors.js';

export default async function handler(request, response) {
  // CORS protection
  if (corsMiddleware(request, response)) return;

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
      return sendNotFound(response, 'No games for this date');
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
          SELECT gr.*, p.name as player_name
          FROM game_results gr
          JOIN players p ON gr.player_id = p.id
          WHERE gr.game_id = ?
          ORDER BY gr.id ASC
        `,
        args: [game.id]
      });

      const players = playersQuery.rows.map(row => ({
        ...row,
        achievements: parseAchievements(row.achievements)
      }));

      gamesWithPlayers.push({
        game: game,
        players: players
      });
    }

    return sendSuccess(response, {
      date: date,
      games: gamesWithPlayers
    });
  } catch (error) {
    return handleError(response, error, 'Day Games API Error');
  }
}

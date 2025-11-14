/**
 * Game API Endpoint
 * Phase 2.1: Refactored to use shared utilities
 */

import { getDB } from '../../shared/database.js';
import { handleError, sendNotFound, sendSuccess, sendUnauthorized, parseAchievements } from '../../shared/handlers.js';
import { corsMiddleware } from '../middleware/cors.js';

export default async function handler(request, response) {
  // CORS protection - only allow requests from allowed origins
  if (corsMiddleware(request, response)) return; // Preflight handled

  const { id: gameId } = request.query;

  // Handle DELETE
  if (request.method === 'DELETE') {
    const authHeader = request.headers.authorization;
    const expectedToken = `Bearer ${process.env.ADMIN_AUTH_TOKEN || 'egor_admin'}`;

    if (!authHeader || authHeader !== expectedToken) {
      return sendUnauthorized(response);
    }

    try {
      const db = getDB();

      const gameQuery = await db.execute({
        sql: 'SELECT * FROM games WHERE id = ?',
        args: [gameId]
      });

      if (gameQuery.rows.length === 0) {
        return sendNotFound(response, 'Game not found');
      }

      const deletedGameNumber = gameQuery.rows[0].game_number;

      await db.execute({
        sql: 'DELETE FROM game_results WHERE game_id = ?',
        args: [gameId]
      });

      await db.execute({
        sql: 'DELETE FROM games WHERE id = ?',
        args: [gameId]
      });

      return sendSuccess(response, {
        message: 'Game deleted successfully',
        deleted_game_number: deletedGameNumber
      });
    } catch (error) {
      return handleError(response, error, 'Delete Game API Error');
    }
  }

  // Handle GET
  try {
    const db = getDB();

    const gameQuery = await db.execute({
      sql: `
        SELECT g.*, gs.date
        FROM games g
        JOIN game_sessions gs ON g.session_id = gs.id
        WHERE g.id = ?
      `,
      args: [gameId]
    });

    if (gameQuery.rows.length === 0) {
      return sendNotFound(response, 'Game not found');
    }

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
      args: [gameId]
    });

    const players = playersQuery.rows.map(row => ({
      ...row,
      achievements: parseAchievements(row.achievements)
    }));

    return sendSuccess(response, {
      game: gameQuery.rows[0],
      players: players
    });
  } catch (error) {
    return handleError(response, error, 'Game API Error');
  }
}

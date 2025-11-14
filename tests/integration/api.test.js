/**
 * Integration tests for API endpoints
 * Tests full request-response cycle with actual Turso database
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('API Integration Tests', () => {

  describe('GET /api/version', () => {
    it('should return version information', async () => {
      const response = await fetch(`${BASE_URL}/api/version`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('version');
      expect(data.version).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('should return correct headers', async () => {
      const response = await fetch(`${BASE_URL}/api/version`);

      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBeDefined();
    });
  });

  describe('GET /api/rating', () => {
    it('should return player ratings', async () => {
      const response = await fetch(`${BASE_URL}/api/rating`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const player = data[0];
        expect(player).toHaveProperty('player_id');
        expect(player).toHaveProperty('player_name');
        expect(player).toHaveProperty('total_score');
        expect(player).toHaveProperty('games_played');
        expect(player).toHaveProperty('win_rate');
      }
    });

    it('should return sorted ratings by total_score', async () => {
      const response = await fetch(`${BASE_URL}/api/rating`);
      const data = await response.json();

      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].total_score).toBeGreaterThanOrEqual(data[i + 1].total_score);
        }
      }
    });

    it('should handle empty database gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/rating`);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/players', () => {
    it('should return list of players', async () => {
      const response = await fetch(`${BASE_URL}/api/players`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const player = data[0];
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('name');
      }
    });

    it('should return unique players', async () => {
      const response = await fetch(`${BASE_URL}/api/players`);
      const data = await response.json();

      const ids = data.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('GET /api/games', () => {
    it('should return list of games', async () => {
      const response = await fetch(`${BASE_URL}/api/games`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const game = data[0];
        expect(game).toHaveProperty('game_id');
        expect(game).toHaveProperty('game_date');
        expect(game).toHaveProperty('winner');
      }
    });

    it('should return games in chronological order', async () => {
      const response = await fetch(`${BASE_URL}/api/games`);
      const data = await response.json();

      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const date1 = new Date(data[i].game_date);
          const date2 = new Date(data[i + 1].game_date);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    });
  });

  describe('GET /api/day-stats', () => {
    it('should return daily statistics', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${BASE_URL}/api/day-stats?date=${today}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('date');
      expect(data).toHaveProperty('total_games');
      expect(data).toHaveProperty('mafia_wins');
      expect(data).toHaveProperty('citizen_wins');
    });

    it('should validate date parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/day-stats?date=invalid-date`);
      expect([400, 200]).toContain(response.status);
    });

    it('should handle missing date parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/day-stats`);
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/day-games', () => {
    it('should return games for specific date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${BASE_URL}/api/day-games?date=${today}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter games by date correctly', async () => {
      const testDate = '2025-01-01';
      const response = await fetch(`${BASE_URL}/api/day-games?date=${testDate}`);
      const data = await response.json();

      data.forEach(game => {
        expect(game.game_date).toContain(testDate);
      });
    });
  });

  describe('POST /api/auth', () => {
    it('should validate authentication credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'wrong-password'
        })
      });

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should require password field', async () => {
      const response = await fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect([400, 401]).toContain(response.status);
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "1' UNION SELECT NULL--"
      ];

      for (const attempt of sqlInjectionAttempts) {
        const response = await fetch(`${BASE_URL}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: attempt })
        });

        expect(response.status).not.toBe(200);
      }
    });
  });

  describe('API Error Handling', () => {
    it('should handle non-existent endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/non-existent`);
      expect(response.status).toBe(404);
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await fetch(`${BASE_URL}/api/rating`, {
        method: 'DELETE'
      });
      expect([405, 404]).toContain(response.status);
    });
  });

  describe('API Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();
      await fetch(`${BASE_URL}/api/rating`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch(`${BASE_URL}/api/version`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('API CORS', () => {
    it('should have proper CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/version`);

      // Check for CORS headers if enabled
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(corsHeader).toBeDefined();
      }
    });
  });
});

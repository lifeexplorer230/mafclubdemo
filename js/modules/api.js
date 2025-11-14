/**
 * API Client Module
 * Phase 2.2: Frontend Modularization
 *
 * Централизованный клиент для работы с API.
 * Устраняет дублирование fetch-вызовов в HTML файлах.
 */

/**
 * Базовый класс для работы с API
 */
class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  /**
   * Универсальный метод для выполнения fetch-запросов
   * @param {string} endpoint - URL эндпоинта (например, '/api/rating')
   * @param {object} options - Опции fetch (method, headers, body, etc.)
   * @returns {Promise<object>} - Распарсенный JSON ответ
   * @throws {Error} - Ошибка API или сети
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      // Проверяем статус ответа
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET запрос
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST запрос
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT запрос
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE запрос
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

/**
 * Специализированный API клиент для MafClubScore
 */
class MafiaAPI extends ApiClient {
  // ============================================
  // VERSION API
  // ============================================

  /**
   * Получить версию приложения
   * @returns {Promise<{version: string, environment: string}>}
   */
  async getVersion() {
    return this.get('/api/version');
  }

  // ============================================
  // RATING API
  // ============================================

  /**
   * Получить рейтинг игроков
   * @returns {Promise<{players: Array}>}
   */
  async getRating() {
    return this.get('/api/rating');
  }

  // ============================================
  // PLAYERS API
  // ============================================

  /**
   * Получить информацию об игроке по ID
   * @param {number} playerId - ID игрока
   * @returns {Promise<object>} - Данные игрока
   */
  async getPlayer(playerId) {
    return this.get(`/api/players/${playerId}`);
  }

  /**
   * Получить список всех игроков
   * @returns {Promise<{players: Array}>}
   */
  async getPlayersList() {
    return this.get('/api/players-list');
  }

  // ============================================
  // GAMES API
  // ============================================

  /**
   * Получить информацию об игре по ID
   * @param {number} gameId - ID игры
   * @returns {Promise<object>} - Данные игры
   */
  async getGame(gameId) {
    return this.get(`/api/games/${gameId}`);
  }

  /**
   * Удалить игру по ID
   * @param {number} gameId - ID игры
   * @returns {Promise<object>}
   */
  async deleteGame(gameId) {
    return this.delete(`/api/games/${gameId}`);
  }

  /**
   * Получить все игры
   * @returns {Promise<{games: Array}>}
   */
  async getAllGames() {
    return this.get('/api/all-games');
  }

  // ============================================
  // DAY STATS API
  // ============================================

  /**
   * Получить статистику по дням
   * @returns {Promise<object>}
   */
  async getDayStats() {
    return this.get('/api/day-stats');
  }

  /**
   * Получить игры за конкретную дату
   * @param {string} date - Дата в формате YYYY-MM-DD
   * @returns {Promise<{games: Array}>}
   */
  async getDayGames(date) {
    return this.get(`/api/day-games?date=${encodeURIComponent(date)}`);
  }

  // ============================================
  // SESSIONS API
  // ============================================

  /**
   * Создать новую игровую сессию
   * @param {object} sessionData - Данные сессии {date, games: [...]}
   * @returns {Promise<object>}
   */
  async createSession(sessionData) {
    return this.post('/api/sessions', sessionData);
  }

  // ============================================
  // AUTH API
  // ============================================

  /**
   * Войти в систему
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<{user: object}>}
   */
  async login(username, password) {
    return this.post('/api/auth/login', { username, password });
  }

  /**
   * Выйти из системы
   * @returns {Promise<object>}
   */
  async logout() {
    return this.post('/api/auth/logout', {});
  }

  /**
   * Проверить статус авторизации
   * @returns {Promise<{authenticated: boolean, user: object}>}
   */
  async checkAuth() {
    return this.get('/api/auth/check');
  }
}

// ============================================
// EXPORT
// ============================================

// Создаём singleton instance для использования в приложении
const api = new MafiaAPI();

// Экспортируем для использования в других модулях
export default api;

// Также экспортируем классы для возможного переиспользования
export { ApiClient, MafiaAPI };

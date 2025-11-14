/**
 * Auth Module
 * Phase 2.2: Frontend Modularization
 *
 * Модуль авторизации и управления сессиями.
 * Централизует логику работы с localStorage и проверку авторизации.
 */

import api from './api.js';

/**
 * Ключи localStorage для хранения данных авторизации
 */
const STORAGE_KEYS = {
  IS_LOGGED_IN: 'maf_is_logged_in',
  USERNAME: 'maf_username',
  USER_ROLE: 'maf_user_role',
  LOGIN_TIME: 'maf_login_time'
};

/**
 * Класс для управления авторизацией
 */
class AuthManager {
  /**
   * Проверяет, авторизован ли пользователь
   * @returns {boolean}
   */
  isLoggedIn() {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  }

  /**
   * Получает имя текущего пользователя
   * @returns {string|null}
   */
  getUsername() {
    return localStorage.getItem(STORAGE_KEYS.USERNAME);
  }

  /**
   * Получает роль текущего пользователя
   * @returns {string|null}
   */
  getUserRole() {
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
  }

  /**
   * Получает время последнего логина
   * @returns {Date|null}
   */
  getLoginTime() {
    const time = localStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
    return time ? new Date(time) : null;
  }

  /**
   * Получает полную информацию о текущем пользователе
   * @returns {object|null}
   */
  getCurrentUser() {
    if (!this.isLoggedIn()) {
      return null;
    }

    return {
      username: this.getUsername(),
      role: this.getUserRole(),
      loginTime: this.getLoginTime()
    };
  }

  /**
   * Выполняет вход через JWT API
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(username, password) {
    try {
      const data = await api.login(username, password);

      if (data.success && data.user) {
        // Сохраняем состояние авторизации
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        localStorage.setItem(STORAGE_KEYS.USERNAME, data.user.username);
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, data.user.role);
        localStorage.setItem(STORAGE_KEYS.LOGIN_TIME, new Date().toISOString());

        console.log('✅ JWT авторизация успешна:', data.user.username);

        return {
          success: true,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: data.error || 'Неверный логин или пароль'
        };
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      return {
        success: false,
        error: 'Ошибка соединения. Попробуйте позже.'
      };
    }
  }

  /**
   * Выполняет выход из системы
   * @returns {Promise<boolean>}
   */
  async logout() {
    try {
      // Вызываем API logout для удаления cookie
      await api.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Продолжаем даже если API недоступен
    }

    // Очищаем localStorage
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.LOGIN_TIME);

    console.log('🚪 Выход выполнен');
    return true;
  }

  /**
   * Проверяет авторизацию через API (проверка JWT cookie)
   * @returns {Promise<boolean>}
   */
  async checkAuth() {
    try {
      const data = await api.checkAuth();

      if (data.authenticated && data.user) {
        // Обновляем localStorage если данные изменились
        if (!this.isLoggedIn() || this.getUsername() !== data.user.username) {
          localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
          localStorage.setItem(STORAGE_KEYS.USERNAME, data.user.username);
          localStorage.setItem(STORAGE_KEYS.USER_ROLE, data.user.role);
        }
        return true;
      } else {
        // Очищаем localStorage если не авторизован
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      // В случае ошибки API проверяем только localStorage
      return this.isLoggedIn();
    }
  }

  /**
   * Редирект на страницу логина если не авторизован
   * @param {string} loginUrl - URL страницы логина (по умолчанию login.html)
   */
  requireAuth(loginUrl = 'login.html') {
    if (!this.isLoggedIn()) {
      console.log('⚠️ Не авторизован, редирект на', loginUrl);
      window.location.href = loginUrl;
      return false;
    }
    return true;
  }

  /**
   * Редирект на главную страницу если уже авторизован
   * @param {string} homeUrl - URL главной страницы (по умолчанию game-input.html)
   */
  redirectIfLoggedIn(homeUrl = 'game-input.html') {
    if (this.isLoggedIn()) {
      console.log('✅ Уже авторизован, редирект на', homeUrl);
      window.location.href = homeUrl;
      return true;
    }
    return false;
  }

  /**
   * Проверяет, истекла ли сессия (например, более 24 часов)
   * @param {number} maxAgeHours - Максимальный возраст сессии в часах
   * @returns {boolean}
   */
  isSessionExpired(maxAgeHours = 24) {
    const loginTime = this.getLoginTime();
    if (!loginTime) return true;

    const now = new Date();
    const diffHours = (now - loginTime) / (1000 * 60 * 60);
    return diffHours > maxAgeHours;
  }

  /**
   * Проверяет сессию и выходит если истекла
   * @param {number} maxAgeHours - Максимальный возраст сессии в часах
   * @returns {Promise<boolean>} - true если сессия валидна
   */
  async validateSession(maxAgeHours = 24) {
    if (!this.isLoggedIn()) {
      return false;
    }

    if (this.isSessionExpired(maxAgeHours)) {
      console.log('⚠️ Сессия истекла');
      await this.logout();
      return false;
    }

    return true;
  }

  /**
   * Проверяет роль пользователя
   * @param {string} requiredRole - Требуемая роль (admin, user, etc.)
   * @returns {boolean}
   */
  hasRole(requiredRole) {
    const userRole = this.getUserRole();
    return userRole === requiredRole;
  }

  /**
   * Проверяет, является ли пользователь администратором
   * @returns {boolean}
   */
  isAdmin() {
    return this.hasRole('admin');
  }
}

// Создаём singleton instance
const auth = new AuthManager();

// Экспортируем
export default auth;
export { AuthManager, STORAGE_KEYS };

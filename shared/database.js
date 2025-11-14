/**
 * Shared Database Utility
 * Phase 2.1: API Refactoring
 *
 * Централизованное управление подключением к базе данных Turso
 */

import { createClient } from '@libsql/client';

/**
 * Создаёт клиент для подключения к Turso database
 * Использует environment variables для credentials
 *
 * @returns {import('@libsql/client').Client} Database client
 */
export function getDB() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}

/**
 * Безопасное выполнение SQL запроса с логированием ошибок
 *
 * @param {string} sql - SQL query
 * @param {Array} args - Query arguments
 * @returns {Promise<Object>} Query result
 */
export async function executeQuery(sql, args = []) {
  const db = getDB();
  try {
    return await db.execute({ sql, args });
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Args:', args);
    throw error;
  }
}

/**
 * Выполняет транзакцию (несколько запросов атомарно)
 *
 * @param {Function} callback - Функция с запросами
 * @returns {Promise<any>} Результат callback
 */
export async function transaction(callback) {
  const db = getDB();

  try {
    await db.execute('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.execute('COMMIT');
    return result;
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

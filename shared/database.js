/**
 * Shared Database Utility
 * Phase 2.1: API Refactoring
 * Phase 2.3: Enhanced with query builders and connection pooling
 *
 * Централизованное управление подключением к базе данных Turso
 */

import { createClient } from '@libsql/client';

/**
 * Список разрешённых имён таблиц
 * SQL injection protection: whitelist approach
 */
const ALLOWED_TABLES = new Set([
  'players',
  'games',
  'game_results',
  'users'
]);

/**
 * Валидирует имя таблицы
 * @param {string} table - Имя таблицы
 * @throws {Error} Если таблица не в whitelist
 */
function validateTableName(table) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Invalid table name: ${table}. Allowed tables: ${Array.from(ALLOWED_TABLES).join(', ')}`);
  }
}

/**
 * Валидирует имя колонки (alphanumeric + underscore)
 * @param {string} column - Имя колонки
 * @throws {Error} Если имя содержит недопустимые символы
 */
function validateColumnName(column) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
    throw new Error(`Invalid column name: ${column}. Only alphanumeric and underscore allowed.`);
  }
}

/**
 * Валидирует ORDER BY выражение
 * @param {string} orderBy - ORDER BY выражение (например: "name ASC" или "id DESC")
 * @throws {Error} Если выражение содержит недопустимые символы
 */
function validateOrderBy(orderBy) {
  // Разрешаем: column_name ASC/DESC, column_name1 ASC, column_name2 DESC
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?(\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?)*$/i.test(orderBy)) {
    throw new Error(`Invalid ORDER BY expression: ${orderBy}. Format: "column ASC" or "col1 DESC, col2 ASC"`);
  }
}

// Connection pool для переиспользования соединений
let dbInstance = null;

/**
 * Создаёт или возвращает существующий клиент для подключения к Turso database
 * Использует environment variables для credentials
 * Реализует простой connection pooling (singleton pattern)
 *
 * @returns {import('@libsql/client').Client} Database client
 */
export function getDB() {
  if (!dbInstance) {
    dbInstance = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    console.log('✅ Database connection created');
  }
  return dbInstance;
}

/**
 * Закрывает соединение с БД (для graceful shutdown)
 */
export async function closeDB() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    console.log('🔒 Database connection closed');
  }
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
    console.error('❌ Database query error:', error);
    console.error('SQL:', sql);
    console.error('Args:', args);
    throw error;
  }
}

/**
 * Выполняет транзакцию (несколько запросов атомарно)
 *
 * @param {Function} callback - Функция с запросами: async (db) => { ... }
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
    console.error('❌ Transaction failed:', error);
    throw error;
  }
}

/**
 * Выполняет SELECT запрос и возвращает массив строк
 *
 * @param {string} table - Имя таблицы
 * @param {Object} options - Опции запроса
 * @param {Array<string>} options.columns - Колонки для SELECT (по умолчанию *)
 * @param {Object} options.where - WHERE условия: {column: value, ...}
 * @param {string} options.orderBy - ORDER BY: 'column ASC' или 'column DESC'
 * @param {number} options.limit - LIMIT
 * @param {number} options.offset - OFFSET
 * @returns {Promise<Array>} Массив строк
 */
export async function select(table, options = {}) {
  const {
    columns = ['*'],
    where = {},
    orderBy = null,
    limit = null,
    offset = null
  } = options;

  // ✅ SQL Injection Protection: Validate table name
  validateTableName(table);

  // ✅ SQL Injection Protection: Validate column names
  if (columns[0] !== '*') {
    columns.forEach(col => validateColumnName(col));
  }

  // Формируем SELECT часть
  const columnsStr = columns.join(', ');
  let sql = `SELECT ${columnsStr} FROM ${table}`;

  // WHERE условия
  const whereKeys = Object.keys(where);
  const args = [];

  if (whereKeys.length > 0) {
    // ✅ SQL Injection Protection: Validate WHERE column names
    whereKeys.forEach(key => validateColumnName(key));

    const whereConditions = whereKeys.map(key => {
      args.push(where[key]);
      return `${key} = ?`;
    });
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // ORDER BY
  if (orderBy) {
    // ✅ SQL Injection Protection: Validate ORDER BY expression
    validateOrderBy(orderBy);
    sql += ` ORDER BY ${orderBy}`;
  }

  // LIMIT & OFFSET
  if (limit !== null) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset !== null) {
    sql += ` OFFSET ${offset}`;
  }

  const result = await executeQuery(sql, args);
  return result.rows || [];
}

/**
 * Выполняет INSERT запрос
 *
 * @param {string} table - Имя таблицы
 * @param {Object} data - Данные для вставки: {column: value, ...}
 * @returns {Promise<Object>} Результат с lastInsertRowid
 */
export async function insert(table, data) {
  // ✅ SQL Injection Protection: Validate table name
  validateTableName(table);

  const columns = Object.keys(data);
  const values = Object.values(data);

  // ✅ SQL Injection Protection: Validate column names
  columns.forEach(col => validateColumnName(col));

  const placeholders = columns.map(() => '?').join(', ');
  const columnsStr = columns.join(', ');

  const sql = `INSERT INTO ${table} (${columnsStr}) VALUES (${placeholders})`;

  const result = await executeQuery(sql, values);
  return {
    lastInsertRowid: result.lastInsertRowid,
    rowsAffected: result.rowsAffected
  };
}

/**
 * Выполняет UPDATE запрос
 *
 * @param {string} table - Имя таблицы
 * @param {Object} data - Данные для обновления: {column: value, ...}
 * @param {Object} where - WHERE условия: {column: value, ...}
 * @returns {Promise<Object>} Результат с rowsAffected
 */
export async function update(table, data, where = {}) {
  // ✅ SQL Injection Protection: Validate table name
  validateTableName(table);

  const dataKeys = Object.keys(data);
  const whereKeys = Object.keys(where);

  if (whereKeys.length === 0) {
    throw new Error('UPDATE без WHERE условия запрещён (для безопасности)');
  }

  // ✅ SQL Injection Protection: Validate column names in SET
  dataKeys.forEach(key => validateColumnName(key));

  // ✅ SQL Injection Protection: Validate column names in WHERE
  whereKeys.forEach(key => validateColumnName(key));

  // SET часть
  const setConditions = dataKeys.map(key => `${key} = ?`);
  const setValues = Object.values(data);

  // WHERE часть
  const whereConditions = whereKeys.map(key => `${key} = ?`);
  const whereValues = Object.values(where);

  const sql = `UPDATE ${table} SET ${setConditions.join(', ')} WHERE ${whereConditions.join(' AND ')}`;
  const args = [...setValues, ...whereValues];

  const result = await executeQuery(sql, args);
  return { rowsAffected: result.rowsAffected };
}

/**
 * Выполняет DELETE запрос
 *
 * @param {string} table - Имя таблицы
 * @param {Object} where - WHERE условия: {column: value, ...}
 * @returns {Promise<Object>} Результат с rowsAffected
 */
export async function deleteFrom(table, where = {}) {
  // ✅ SQL Injection Protection: Validate table name
  validateTableName(table);

  const whereKeys = Object.keys(where);

  if (whereKeys.length === 0) {
    throw new Error('DELETE без WHERE условия запрещён (для безопасности)');
  }

  // ✅ SQL Injection Protection: Validate column names in WHERE
  whereKeys.forEach(key => validateColumnName(key));

  const whereConditions = whereKeys.map(key => `${key} = ?`);
  const whereValues = Object.values(where);

  const sql = `DELETE FROM ${table} WHERE ${whereConditions.join(' AND ')}`;

  const result = await executeQuery(sql, whereValues);
  return { rowsAffected: result.rowsAffected };
}

/**
 * Выполняет COUNT запрос
 *
 * @param {string} table - Имя таблицы
 * @param {Object} where - WHERE условия: {column: value, ...}
 * @returns {Promise<number>} Количество строк
 */
export async function count(table, where = {}) {
  // ✅ SQL Injection Protection: Validate table name
  validateTableName(table);

  const whereKeys = Object.keys(where);
  const args = [];

  let sql = `SELECT COUNT(*) as count FROM ${table}`;

  if (whereKeys.length > 0) {
    // ✅ SQL Injection Protection: Validate column names in WHERE
    whereKeys.forEach(key => validateColumnName(key));

    const whereConditions = whereKeys.map(key => {
      args.push(where[key]);
      return `${key} = ?`;
    });
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  const result = await executeQuery(sql, args);
  return result.rows[0]?.count || 0;
}

/**
 * Проверяет существование записи
 *
 * @param {string} table - Имя таблицы
 * @param {Object} where - WHERE условия: {column: value, ...}
 * @returns {Promise<boolean>}
 */
export async function exists(table, where) {
  const total = await count(table, where);
  return total > 0;
}

/**
 * Получает одну запись по условию
 *
 * @param {string} table - Имя таблицы
 * @param {Object} where - WHERE условия: {column: value, ...}
 * @returns {Promise<Object|null>} Первая найденная запись или null
 */
export async function findOne(table, where) {
  const rows = await select(table, { where, limit: 1 });
  return rows[0] || null;
}

/**
 * Получает запись по ID
 *
 * @param {string} table - Имя таблицы
 * @param {number} id - ID записи
 * @returns {Promise<Object|null>}
 */
export async function findById(table, id) {
  return findOne(table, { id });
}

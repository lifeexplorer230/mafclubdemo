/**
 * JWT Authentication Login Endpoint
 * Phase 1.5: JWT Authentication
 * Phase 2.1: Refactored to use shared database utilities
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../../shared/database.js';
import { handleError, sendUnauthorized, sendBadRequest, sendSuccess } from '../../shared/handlers.js';

export default async function handler(request, response) {
  // Only POST allowed
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = request.body;

    // Validate input
    if (!username || !password) {
      return sendBadRequest(response, 'Username and password required');
    }

    // Get user from database
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    if (result.rows.length === 0) {
      return sendUnauthorized(response, 'Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return sendUnauthorized(response, 'Invalid credentials');
    }

    // Generate JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'temporary-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set httpOnly cookie for security
    const isProduction = process.env.VERCEL_ENV === 'production';
    const cookieOptions = [
      `auth_token=${token}`,
      'HttpOnly',
      isProduction ? 'Secure' : '',
      'SameSite=Strict',
      'Max-Age=86400', // 24 hours
      'Path=/'
    ].filter(Boolean).join('; ');

    response.setHeader('Set-Cookie', cookieOptions);

    return sendSuccess(response, {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return handleError(response, error, 'Login error');
  }
}

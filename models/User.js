const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
  static async create(userData) {
    const { username, email, password, verification_token } = userData;
    console.log('User.create called with:', { username, email, verification_token });
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [username, email, hashedPassword, verification_token]);
    return result.insertId;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async findByVerificationToken(token) {
    const query = 'SELECT * FROM users WHERE verification_token = ?';
    const [rows] = await pool.execute(query, [token]);
    return rows[0];
  }

  static async verifyUser(userId) {
    const query = 'UPDATE users SET verified = TRUE, verification_token = NULL WHERE id = ?';
    await pool.execute(query, [userId]);
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    await pool.execute(query, [userId]);
  }

  static async set2FASecret(userId, secret) {
    const query = 'UPDATE users SET twofa_secret = ?, twofa_enabled = FALSE WHERE id = ?';
    await pool.execute(query, [secret, userId]);
  }

  static async enable2FA(userId) {
    const query = 'UPDATE users SET twofa_enabled = TRUE WHERE id = ?';
    await pool.execute(query, [userId]);
  }

  static async findByIdFull(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }
}

module.exports = User; 
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class Admin {
  static async create(adminData) {
    const { username, email, password, role = 'admin' } = adminData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = 'INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [username, email, hashedPassword, role]);
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM admins WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, email, role, created_at FROM admins WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Admin-specific methods for user management
  static async getAllUsers() {
    const query = `
      SELECT id, username, email, created_at, last_login,
      (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = users.id) as total_attempts,
      (SELECT AVG(score) FROM quiz_attempts WHERE user_id = users.id) as avg_score
      FROM users 
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getUserById(userId) {
    const query = `
      SELECT u.*, 
      (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = u.id) as total_attempts,
      (SELECT AVG(score) FROM quiz_attempts WHERE user_id = u.id) as avg_score,
      (SELECT MAX(score) FROM quiz_attempts WHERE user_id = u.id) as best_score
      FROM users u WHERE u.id = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows[0];
  }

  static async deleteUser(userId) {
    // First delete quiz attempts
    await pool.execute('DELETE FROM quiz_attempts WHERE user_id = ?', [userId]);
    // Then delete user
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    return result.affectedRows > 0;
  }

  // Admin methods for question management
  static async getAllQuestions() {
    const query = 'SELECT * FROM quiz_questions ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getQuestionById(questionId) {
    const query = 'SELECT * FROM quiz_questions WHERE id = ?';
    const [rows] = await pool.execute(query, [questionId]);
    return rows[0];
  }

  static async createQuestion(questionData) {
    const { question, options, correct_answer, category, difficulty } = questionData;
    const query = 'INSERT INTO quiz_questions (question, options, correct_answer, category, difficulty) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [question, JSON.stringify(options), correct_answer, category, difficulty]);
    return result.insertId;
  }

  static async updateQuestion(questionId, questionData) {
    const { question, options, correct_answer, category, difficulty } = questionData;
    const query = 'UPDATE quiz_questions SET question = ?, options = ?, correct_answer = ?, category = ?, difficulty = ? WHERE id = ?';
    const [result] = await pool.execute(query, [question, JSON.stringify(options), correct_answer, category, difficulty, questionId]);
    return result.affectedRows > 0;
  }

  static async deleteQuestion(questionId) {
    const [result] = await pool.execute('DELETE FROM quiz_questions WHERE id = ?', [questionId]);
    return result.affectedRows > 0;
  }

  // Admin methods for system statistics
  static async getSystemStats() {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [questionCount] = await pool.execute('SELECT COUNT(*) as count FROM quiz_questions');
    const [attemptCount] = await pool.execute('SELECT COUNT(*) as count FROM quiz_attempts');
    const [avgScore] = await pool.execute('SELECT AVG(score) as avg FROM quiz_attempts');
    const [recentAttempts] = await pool.execute(`
      SELECT qa.*, u.username 
      FROM quiz_attempts qa 
      JOIN users u ON qa.user_id = u.id 
      ORDER BY qa.created_at DESC 
      LIMIT 10
    `);

    return {
      totalUsers: userCount[0].count,
      totalQuestions: questionCount[0].count,
      totalAttempts: attemptCount[0].count,
      averageScore: avgScore[0].avg || 0,
      recentAttempts: recentAttempts
    };
  }
}

module.exports = Admin; 
const { pool } = require('../config/db');

class QuizAttempt {
  static async create(attemptData) {
    const { user_id, score, total_questions, correct_answers, answers, time_taken } = attemptData;
    const query = 'INSERT INTO quiz_attempts (user_id, score, total_questions, correct_answers, answers, time_taken) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [user_id, score, total_questions, correct_answers, JSON.stringify(answers), time_taken]);
    return result.insertId;
  }

  static async getUserAttempts(userId) {
    const query = `
      SELECT id, score, total_questions, correct_answers, time_taken, created_at 
      FROM quiz_attempts 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
  }

  static async getAttemptById(attemptId) {
    const query = 'SELECT * FROM quiz_attempts WHERE id = ?';
    const [rows] = await pool.execute(query, [attemptId]);
    return rows[0];
  }

  static async getUserStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_attempts,
        AVG(score) as average_score,
        MAX(score) as best_score,
        SUM(time_taken) as total_time
      FROM quiz_attempts 
      WHERE user_id = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows[0];
  }

  static async getLeaderboard(limit = 10) {
    const query = `
      SELECT 
        u.username,
        qa.score,
        qa.total_questions,
        qa.correct_answers,
        qa.created_at
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      ORDER BY qa.score DESC, qa.time_taken ASC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [limit]);
    return rows;
  }
}

module.exports = QuizAttempt; 
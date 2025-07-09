const { pool } = require('../config/db');

class QuizAttempt {
  static async create(attemptData) {
    const { user_id, score, total_questions, correct_answers, level_id, time_taken, answers } = attemptData;
    const query = `
      INSERT INTO quiz_attempts 
        (user_id, score, total_questions, correct_answers, level_id, started_at, completed_at, time_taken, answers)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
    `;
    const [result] = await pool.execute(query, [
      user_id,
      score,              // e.g., 87.50
      total_questions,
      correct_answers,
      level_id,
      time_taken,
      JSON.stringify(answers)
    ]);
    return result.insertId;
  }

  static async getUserAttempts(userId) {
    const query = `
      SELECT id, score, total_questions, correct_answers, time_taken, started_at 
      FROM quiz_attempts 
      WHERE user_id = ? 
      ORDER BY started_at DESC
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
        qa.started_at
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
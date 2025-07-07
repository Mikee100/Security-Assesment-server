const { pool } = require('../config/db');

class Quiz {
  static async getAllQuestions() {
    const query = 'SELECT * FROM quiz_questions ORDER BY RAND()';
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async getQuestionsByCategory(category) {
    const query = 'SELECT * FROM quiz_questions WHERE category = ? ORDER BY RAND()';
    const [rows] = await pool.execute(query, [category]);
    return rows;
  }

  static async getQuestionById(id) {
    const query = 'SELECT * FROM quiz_questions WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async createQuestion(questionData) {
    const { question, options, correct_answer, category, difficulty } = questionData;
    const query = 'INSERT INTO quiz_questions (question, options, correct_answer, category, difficulty) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [question, JSON.stringify(options), correct_answer, category, difficulty]);
    return result.insertId;
  }

  static async getCategories() {
    const query = 'SELECT DISTINCT category FROM quiz_questions';
    const [rows] = await pool.execute(query);
    return rows.map(row => row.category);
  }
}

module.exports = Quiz; 
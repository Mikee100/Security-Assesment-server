const { pool } = require('../config/db');

const createQuestion = async (req, res) => {
  try {
    const { question, options, correct_answer, category, difficulty, level_id, level_name } = req.body;
    if (!question || !options || !correct_answer) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    // Determine level_id
    let finalLevelId = level_id;
    if (!finalLevelId && (difficulty || level_name)) {
      // Try to find level by name
      const [levels] = await pool.execute('SELECT id FROM levels WHERE name = ?', [difficulty || level_name]);
      if (levels.length === 0) {
        return res.status(400).json({ error: 'Invalid difficulty/level' });
      }
      finalLevelId = levels[0].id;
    }
    if (!finalLevelId) {
      return res.status(400).json({ error: 'Level is required' });
    }
    await pool.execute(
      'INSERT INTO quiz_questions (question, options, correct_answer, category, level_id) VALUES (?, ?, ?, ?, ?)',
      [question, JSON.stringify(options), correct_answer, category || null, finalLevelId]
    );
    res.status(201).json({ message: 'Question created successfully' });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const { level_id, difficulty, level_name } = req.query;
    let query = 'SELECT q.*, l.name as level FROM quiz_questions q LEFT JOIN levels l ON q.level_id = l.id';
    let params = [];
    if (level_id) {
      query += ' WHERE q.level_id = ?';
      params.push(level_id);
    } else if (difficulty || level_name) {
      query += ' WHERE l.name = ?';
      params.push(difficulty || level_name);
    }
    query += ' ORDER BY q.created_at DESC';
    const [questions] = await pool.execute(query, params);
    res.json({ questions });
  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getLevels = async (req, res) => {
  try {
    const [levels] = await pool.execute('SELECT * FROM levels ORDER BY id');
    res.json({ levels });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getQuizResults = async (req, res) => {
  try {
    // Fetch all results
    const [results] = await pool.execute(
      `SELECT qa.*, u.username, l.name as level
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       LEFT JOIN levels l ON qa.level_id = l.id
       ORDER BY qa.completed_at DESC`
    );
    // Fetch stats
    const [[overall]] = await pool.execute(`
      SELECT COUNT(*) as total_attempts, AVG(score) as avg_score, MAX(score) as best_score, MIN(score) as worst_score FROM quiz_attempts
    `);
    const [perLevel] = await pool.execute(`
      SELECT l.name as level, COUNT(*) as attempts, AVG(score) as avg_score
      FROM quiz_attempts qa
      LEFT JOIN levels l ON qa.level_id = l.id
      GROUP BY qa.level_id
    `);
    res.json({
      results,
      stats: {
        total_attempts: overall.total_attempts,
        avg_score: overall.avg_score,
        best_score: overall.best_score,
        worst_score: overall.worst_score,
        per_level: perLevel
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createQuestion, getAllQuestions, getLevels, getQuizResults }; 
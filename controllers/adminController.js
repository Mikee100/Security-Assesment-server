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

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, username, email, role, created_at, verified FROM users ORDER BY created_at DESC');
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const [[userStats]] = await pool.execute('SELECT COUNT(*) as total_users FROM users');
    const [[quizStats]] = await pool.execute('SELECT COUNT(*) as total_quizzes FROM quizzes');
    const [[attemptStats]] = await pool.execute('SELECT COUNT(*) as total_attempts FROM quiz_attempts');
    const [[questionStats]] = await pool.execute('SELECT COUNT(*) as total_questions FROM quiz_questions');
    res.json({
      total_users: userStats.total_users,
      total_quizzes: quizStats.total_quizzes,
      total_attempts: attemptStats.total_attempts,
      total_questions: questionStats.total_questions
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM quiz_questions WHERE id = ?', [id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correct_answer, category, level_id } = req.body;
    await pool.execute(
      'UPDATE quiz_questions SET question = ?, options = ?, correct_answer = ?, category = ?, level_id = ? WHERE id = ?',
      [question, JSON.stringify(options), correct_answer, category, level_id, id]
    );
    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createQuestion, getAllQuestions, getLevels, getQuizResults, getAllUsers, getAdminStats, deleteQuestion, updateQuestion }; 
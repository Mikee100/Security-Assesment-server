const express = require('express');
const router = express.Router();
const { 
  getQuestions, 
  submitQuiz, 
  getCategories, 
  getUserAttempts, 
  getUserStats, 
  getLeaderboard,
  recordQuizAttempt
} = require('../controllers/quizController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/questions', getQuestions);
router.get('/categories', getCategories);
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.post('/submit', authenticateToken, submitQuiz);
router.get('/attempts', authenticateToken, getUserAttempts);
router.get('/stats', authenticateToken, getUserStats);

module.exports = router; 
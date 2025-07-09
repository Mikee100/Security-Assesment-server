const express = require('express');
const router = express.Router();
const { createQuestion, getAllQuestions, getLevels, getQuizResults, getAllUsers, getAdminStats, deleteQuestion, updateQuestion } = require('../controllers/adminController');

// Public route to fetch all levels
router.get('/levels', getLevels);
// Public route to fetch all questions
router.get('/questions', getAllQuestions);
// Admin route to create questions
router.post('/questions', createQuestion);
// Admin route to delete a question
router.delete('/questions/:id', deleteQuestion);
// Admin route to update a question
router.put('/questions/:id', updateQuestion);

router.get('/results', getQuizResults);
// Admin route to get all users
router.get('/users', getAllUsers);
// Admin route to get stats
router.get('/stats', getAdminStats);

module.exports = router; 
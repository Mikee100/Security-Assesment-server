const express = require('express');
const router = express.Router();
const { createQuestion, getAllQuestions, getLevels, getQuizResults } = require('../controllers/adminController');

// Public route to fetch all levels
router.get('/levels', getLevels);
// Public route to fetch all questions
router.get('/questions', getAllQuestions);
// Admin route to create questions
router.post('/questions', createQuestion);

router.get('/results', getQuizResults);

module.exports = router; 
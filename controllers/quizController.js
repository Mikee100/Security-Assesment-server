const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { pool } = require('../config/db');

const getQuestions = async (req, res) => {
  try {
    const { category, limit } = req.query;
    let questions;

    if (category) {
      questions = await Quiz.getQuestionsByCategory(category);
    } else {
      questions = await Quiz.getAllQuestions();
    }

    // Limit to user-specified number of questions, default 10
    const numQuestions = parseInt(limit) || 10;
    questions = questions.slice(0, numQuestions);

    // Remove correct answers from questions sent to client
    const questionsForClient = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options),
      category: q.category,
      difficulty: q.difficulty
    }));

    res.json({ questions: questionsForClient });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { answers, timeTaken, level_id } = req.body;
    const userId = req.user.userId;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    let correctAnswers = 0;
    const totalQuestions = answers.length;
    const results = [];

    // Check each answer
    for (const answer of answers) {
      const question = await Quiz.getQuestionById(answer.questionId);
      if (!question) continue;

      const isCorrect = answer.selectedAnswer === question.correct_answer;
      if (isCorrect) correctAnswers++;

      results.push({
        questionId: answer.questionId,
        question: question.question,
        userAnswer: answer.selectedAnswer,
        correctAnswer: question.correct_answer,
        isCorrect
      });
    }

    // Calculate score (percentage)
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Save attempt
    const attemptData = {
      user_id: userId,
      score: score ?? null,
      total_questions: totalQuestions ?? null,
      correct_answers: correctAnswers ?? null,
      answers: results ?? null,
      time_taken: timeTaken ?? null,
      level_id: level_id ?? null, // Use level_id from req.body
    };

    const attemptId = await QuizAttempt.create(attemptData);

    res.json({
      message: 'Quiz submitted successfully',
      attemptId,
      score,
      totalQuestions,
      correctAnswers,
      results
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Quiz.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserAttempts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const attempts = await QuizAttempt.getUserAttempts(userId);
    res.json({ attempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await QuizAttempt.getUserStats(userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await QuizAttempt.getLeaderboard(parseInt(limit));
    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getQuestions,
  submitQuiz,
  getCategories,
  getUserAttempts,
  getUserStats,
  getLeaderboard
}; 
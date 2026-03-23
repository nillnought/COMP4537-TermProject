const express = require('express');
const QuizGenerator = require('./quizGenerator');

const router = express.Router();
const quizGenerator = new QuizGenerator();

router.post('/generate-quiz', quizGenerator.generateQuiz);

module.exports = router;
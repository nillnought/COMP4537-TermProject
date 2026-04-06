const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  quizID: { type: Number, required: true, index: true },
  studentID: { type: Number, required: true, index: true },
  attempts: { type: Number, required: true, default: 1 },
  score: { type: Number, required: true },
});

module.exports = mongoose.model('Score', scoreSchema);

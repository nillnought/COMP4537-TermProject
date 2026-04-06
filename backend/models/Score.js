const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  quizID: { type: Number, required: true, unique: true, index: true },
  studentID: { type: Number, required: true, index: true },
  completed: { type: Boolean, required: true, default: false },
  score: { type: Number, required: true, default: [] },
});

module.exports = mongoose.model('Score', scoreSchema);

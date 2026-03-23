const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionID: { type: Number, required: true, unique: true, index: true },
  quizID: { type: Number, required: true, index: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
});

module.exports = mongoose.model('Question', questionSchema);

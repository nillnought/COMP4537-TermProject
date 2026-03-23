const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  quizID: { type: Number, required: true, unique: true, index: true },
  classID: { type: Number, required: true, index: true },
  name: { type: String, required: true },
});

module.exports = mongoose.model('Quiz', quizSchema);

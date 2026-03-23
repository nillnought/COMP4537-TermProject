const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  quizID: { type: Number, required: true, unique: true, index: true },
  studentID: { type: Number, required: true, index: true },
  completed: { type: Boolean, required: true, default: false },
  answers: { type: [Number], required: true, default: [] },
});

module.exports = mongoose.model('Progress', progressSchema);

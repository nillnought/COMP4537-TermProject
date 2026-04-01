const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  quizID: { type: Number, required: true, unique: true, index: true },
  studentID: { type: Number, required: true, index: true }, // Links the quiz to the user
  classID: { type: Number, default: 0 }, // Optional: link to a class later
  title: { type: String, required: true },
  questions: { type: Array, required: true, default: [] }, // Stores the AI's question array
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
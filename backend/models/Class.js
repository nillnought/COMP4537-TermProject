const mongoose = require('mongoose');

// Define a sub-schema for chapters to keep things organized
const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // This will hold the text extracted from the PDF
  uploadedBy: { type: Number, required: true } // Stores the student's ID who uploaded it
});

// Add the entryCode line to your existing classSchema
const classSchema = new mongoose.Schema({
  classID: { type: Number, required: true, unique: true, index: true },
  teacherID: { type: Number, required: true, index: true },
  name: { type: String, required: true },
  entryCode: { type: String, required: true, unique: true }, // NEW: The "Kahoot" join code
  students: { type: [Number], required: true, default: [] },
  chapters: [chapterSchema]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classID: { type: Number, required: true, unique: true, index: true },
  teacherID: { type: Number, required: true, index: true },
  students: { type: [Number], required: true, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);

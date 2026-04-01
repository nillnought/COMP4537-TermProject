const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, enum: ['user', 'admin'], default: 'user' },
  classes: { type: [Number], required: true, default: [] },
  tokens: {type: Number, default: function () {
    return this.type ==='user' ? 20 : null;
  }}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
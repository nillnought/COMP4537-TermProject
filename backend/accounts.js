const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

class Accounts {
  constructor(){
    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/register', this.registerUser.bind(this));
    this.router.post('/login', this.loginUser.bind(this));
  }

  async registerUser(req, res) {
    try {
      const { email, password, type } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Generate sequential numeric id, starting at 1
      const latest = await User.findOne().sort({ id: -1 }).exec();
      const nextId = latest ? latest.id + 1 : 1;

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        id: nextId,
        email,
        password: hashedPassword,
        type: type === 'admin' ? 'admin' : 'user',
      });
      await user.save();
      res.status(201).json({ message: 'User registered', type: user.type, id: user.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id, userId: user.id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, type: user.type, userId: user.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = Accounts;



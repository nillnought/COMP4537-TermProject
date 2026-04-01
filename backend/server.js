require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Auth = require('./middleware/auth');
const Accounts = require('./accounts');
const quizRoutes = require('./quizRoutes');
const User = require('./models/User');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8000;
    this.configureMiddleware();
    this.connectMongo();
    this.configureRoutes();
    
    this.start();
  }

  configureMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  async connectMongo() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected successfully');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    }
  }

  configureRoutes() {
    this.app.use('/api/auth', new Accounts().router);

    this.app.use(
      '/api/quiz',
      Auth.verifyToken,
      Auth.requireRole('user'),
      quizRoutes
    );

    //gets users and tokens for admin
    this.app.get(
      '/api/admin/user-tokens',
      Auth.verifyToken,
      Auth.requireRole('admin'),
      async (req, res) => {
        try {
          const users = await User.find({ type: 'user' }).select('id email tokens _id');
          res.json(users);
        } catch(err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to fetch user tokens' });
        }
      }
    )

    //user token routes
    this.app.get('/api/tokens/balance', Auth.verifyToken, Auth.requireRole('user'), async (req, res) => {
      try {
        const numericId = req.user.userId || req.user.id;

        if (!numericId) {
          return res.status(400).json({ error: 'User ID missing from token' });
        }
        const user = await User.findOne({ id: numericId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ tokens: user.tokens });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch token balance' });
      }
    });
    //uses a token
    this.app.post('/api/tokens/use', Auth.verifyToken, Auth.requireRole('user'), async (req, res) => {
      try {
        const numericId = req.user.userId || req.user.id;

        if (!numericId) {
          return res.status(400).json({ error: 'User ID missing from token' });
        }
        const user = await User.findOne({ id: numericId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.tokens <= 0) {
          return res.status(403).json({ error: 'Insufficient tokens' });
        }

        user.tokens -= 1;
        await user.save();

        res.json({ success: true, tokensRemaining: user.tokens });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to use token' });
      }
    });

    //admin adds a token
    this.app.post('/api/admin/add-tokens', Auth.verifyToken, Auth.requireRole('admin'), async (req, res) => {
      try {
        const { targetUserId, amount } = req.body;

        if (!targetUserId || !amount) {
          return res.status(400).json({ error: 'Missing targetUserId or amount' });
        }

        const user = await User.findOne({ id: Number(targetUserId) });
        if (!user) return res.status(404).json({ error: 'Target user not found' });

        user.tokens += parseInt(amount);
        await user.save();

        res.json({ success: true, newTotal: user.tokens });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add tokens' });
      }
    });

    this.app.get('/user-landing', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/user-landing.html'));
    });

    this.app.get('/admin-landing', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/admin-landing.html'));
    });

    this.app.get('/take-quiz.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/take-quiz.html'));
    });

    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });

    // Serve static files as fallback
    this.app.use(express.static(path.join(__dirname, '../frontend')));

    // Catch-all 404 route
    this.app.use((req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

new Server();
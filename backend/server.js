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

    this.app.get(
      '/api/admin/user-tokens',
      Auth.verifyToken,
      Auth.requireRole('admin'),
      async (req, res) => {
        try {
          const users = await User.find({ type: 'user' }).select('id email tokens -_id');
          res.json(users);
        } catch(err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to fetch user tokens' });
        }
      }
    )

    this.app.get('/user-landing', Auth.verifyToken, Auth.requireRole('user'), (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/user-landing.html'));
    });

    this.app.get('/admin-landing', Auth.verifyToken, Auth.requireRole('admin'), (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/admin-landing.html'));
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
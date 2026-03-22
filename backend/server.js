require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Auth = require('./middleware/auth');
const Accounts = require('./accounts');

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
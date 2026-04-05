const express = require('express');
const Auth = require('./middleware/auth');
const Class = require('./models/Class');
const User = require('./models/User');
const Quiz = require('./models/Quiz');

const router = express.Router();

router.post('/create', Auth.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create classes' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const highestClass = await Class.findOne({}).sort({ classID: -1 });
    const nextClassID = highestClass ? highestClass.classID + 1 : 1;

    const newClass = await Class.create({
      classID: nextClassID,
      teacherID: req.user.userId,
      name: name.trim(),
      students: []
    });

    return res.json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.get('/my-classes', Auth.verifyToken, async (req, res) => {
  try {
    const numericId = req.user.userId || req.user.id;
    if (!numericId) {
      return res.status(400).json({ error: 'User ID missing from token' });
    }

    if (req.user.role === 'teacher') {
      const classes = await Class.find({ teacherID: numericId });
      return res.json(classes);
    }

    const classes = await Class.find({ students: numericId });
    return res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.post('/:classID/assign-quiz', Auth.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can assign quizzes' });
    }

    const classID = Number(req.params.classID);
    const { quizID } = req.body;

    if (!quizID) {
      return res.status(400).json({ error: 'Quiz ID is required' });
    }

    const classDoc = await Class.findOne({ classID });
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const quiz = await Quiz.findOne({ quizID });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    quiz.classID = classID;
    await quiz.save();

    return res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign quiz to class' });
  }
});

router.post('/join', Auth.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join classes' });
    }

    const classID = Number(req.body.classID);
    if (!classID) {
      return res.status(400).json({ error: 'Class code is required' });
    }

    const classDoc = await Class.findOne({ classID });
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const numericId = req.user.userId || req.user.id;
    if (!numericId) {
      return res.status(400).json({ error: 'User ID missing from token' });
    }

    if (classDoc.students.includes(numericId)) {
      return res.status(409).json({ error: "You're already in this class" });
    }

    classDoc.students.push(numericId);
    await classDoc.save();

    const user = await User.findOne({ id: numericId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.classes.includes(classID)) {
      user.classes.push(classID);
      await user.save();
    }

    return res.json(classDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

module.exports = router;

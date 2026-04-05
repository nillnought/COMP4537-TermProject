const express = require('express');
const router = express.Router();
const Class = require('./models/Class');
const User = require('./models/User');
const Quiz = require('./models/Quiz');

// GET: Fetch all classes the student is enrolled in
router.get('/my-classes', async (req, res) => {
    try {
        const numericId = req.user.userId || req.user.id;
        const user = await User.findOne({ id: numericId });
        
        // Find all classes where the classID exists in the user's classes array
        const classes = await Class.find({ classID: { $in: user.classes } });
        res.json(classes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
});

// POST: Join a class using an entry code
router.post('/join', async (req, res) => {
    try {
        const numericId = req.user.userId || req.user.id;
        const { entryCode } = req.body;

        if (!entryCode) return res.status(400).json({ error: 'Entry code is required' });

        // Find the class by its Kahoot-style code
        const targetClass = await Class.findOne({ entryCode: entryCode });
        if (!targetClass) return res.status(404).json({ error: 'Invalid entry code. Please check with your teacher.' });

        const user = await User.findOne({ id: numericId });

        // Prevent duplicate joins
        if (user.classes.includes(targetClass.classID)) {
            return res.status(400).json({ error: 'You are already enrolled in this class.' });
        }

        // Add class to user, and user to class
        user.classes.push(targetClass.classID);
        await user.save();

        targetClass.students.push(numericId);
        await targetClass.save();

        res.json({ success: true, class: targetClass });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to join class' });
    }
});

// GET: Fetch pre-made quizzes for a specific class
router.get('/:classId/quizzes', async (req, res) => {
    try {
        const { classId } = req.params;
        // Fetch any quiz tied to this classID
        const quizzes = await Quiz.find({ classID: Number(classId) });
        res.json(quizzes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch class quizzes' });
    }
});

module.exports = router;
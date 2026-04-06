const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse-new');
const QuizGenerator = require('./quizGenerator');
const User = require('./models/User');
const Class = require('./models/Class');
const Quiz = require('./models/Quiz');
const Score = require('./models/Score');
const router = express.Router();
const quizGenerator = new QuizGenerator();

const upload = multer({ storage: multer.memoryStorage() });

// Your existing text-based generation route
router.post('/generate-quiz', quizGenerator.generateQuiz);

// Route to fetch a user's saved quizzes
router.get('/my-quizzes', async (req, res) => {
    try {
        const numericId = req.user.userId || req.user.id;

        const user = await User.findOne({ id: numericId });

        let myQuizzes = [];

        if (user.role == 'student') {
            const myClasses = await Class.find({ students: numericId });
            for (const aClass of myClasses) {
                const quizzes = await Quiz.find({ classID: aClass.classID }).sort({ createdAt: -1 });

                if (quizzes != []) {
                    console.log(myQuizzes);
                    myQuizzes = myQuizzes.concat(quizzes);
                    console.log(myQuizzes);
                } 
            }
        } else if (user.role == 'teacher') {
            // Find all quizzes matching the teacher's ID, sorted by newest first
            myQuizzes = await Quiz.find({ teacherID: numericId }).sort({ createdAt: -1 });
        } else {
            res.status(500).json({ error: 'Failed to fetch user information' });
        }
        
        console.log(myQuizzes);
        res.json(myQuizzes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// PDF-based generation route
router.post('/generate-from-pdf', upload.single('document'), async (req, res) => {
    try {
        console.log("1. PDF Upload Request received!");
        
        if (!req.file) {
            console.log("ERROR: No file attached to request.");
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }
        
        // NEW: Grab the number from multer's parsed text fields (defaults to 10 if missing)
        const requestedQuestions = req.body.numQuestions || 10;
        console.log(`2. File recognized: ${req.file.originalname} (${req.file.size} bytes). User requested ${requestedQuestions} questions.`);

        console.log("3. Beginning PDF parsing...");
        const pdfData = await pdfParse(req.file.buffer);
        const extractedText = pdfData.text;
        
        console.log(`4. Success! Extracted ${extractedText.length} characters of text.`);

        // Attach text to body and run the AI generator
        req.body.topic = extractedText;
        // req.body.numQuestions is already attached thanks to multer!
        
        console.log("5. Handing off to AI Generator...");
        await quizGenerator.generateQuiz(req, res);

    } catch (err) {
        // This will print the exact reason to your VS Code terminal
        console.error("\n--- ERROR IN PDF ROUTE ---");
        console.error(err);
        
        // This sends the actual error reason to your frontend pop-up
        res.status(500).json({ error: `Failed to process PDF: ${err.message}` });
    }
});

router.post('/hint', async (req, res) => {
    await quizGenerator.generateHint(req, res);
});

//for getting a quiz by its quiz ID
router.get('/:id', async(req, res) => {
    try {
        const quiz = await Quiz.findOne({quizID: req.params.id});
        if (!quiz) {
            return res.status(404).json({error: "Quiz could not be found."});
        }
        res.json(quiz);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {title, questions} = req.body;
        const updated = await Quiz.findOneAndUpdate(
            {quizID: req.params.id},
            {title, questions},
            { returnDocument: 'after' }
        );

        if (!updated) {
            return res.status(404).json({error: "Quiz not found"});
        }
        res.json(updated);
    } catch(err){
        res.status(500).json({error: "Failed to update quiz"});
    }
});

router.post('/record-score', async(req, res) => {
    try {
        const score = Score.findOne({ quizID: req.body.quizId, studentID: req.body.studentId});

        if (score == null) {
            const newScore = new Score({
                quizID: req.body.quizId,
                studentID: req.body.studentId, 
                score: req.body.score
            });

            await newScore.save();
        } else {
            Score.updateOne(score, { $inc: { attempts: +1 }, $set: { score: this.score } })
        }

        res.json({ score: newScore });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Failed to record score" });
    }
})

router.post('/create-empty', async(req, res) => {
    try{
        const numericId = req.user.userId || req.user.id;

        const latest = await Quiz.findOne().sort({ quizID: -1 });
        const nextId = latest ? latest.quizID + 1 : 1;

        const newQuiz = new Quiz({
            quizID: nextId,
            teacherID: numericId,
            title: "Untitled Quiz",
            questions: []
        });

        await newQuiz.save();

        res.json(newQuiz);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Failed to create empty quiz"});
    }
});

module.exports = router;
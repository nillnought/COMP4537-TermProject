const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse-new');
const QuizGenerator = require('./quizGenerator');
const Quiz = require('./models/Quiz');
const router = express.Router();
const quizGenerator = new QuizGenerator();

const upload = multer({ storage: multer.memoryStorage() });

// Your existing text-based generation route
router.post('/generate-quiz', quizGenerator.generateQuiz);

// Route to fetch a user's saved quizzes
router.get('/my-quizzes', async (req, res) => {
    try {
        const numericId = req.user.userId || req.user.id;
        
        // Find all quizzes matching the student's ID, sorted by newest first
        const myQuizzes = await Quiz.find({ studentID: numericId }).sort({ createdAt: -1 });
        
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

module.exports = router;
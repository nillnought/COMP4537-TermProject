const AIModel = require("./AIModel");
const User = require("./models/User"); // Correctly pointing to your existing User model
const Quiz = require("./models/Quiz");

class QuizGenerator {
    constructor() {
        this.aiModel = new AIModel(process.env.API_KEY);
        this.generateQuiz = this.generateQuiz.bind(this);
    }

    async generateQuiz(req, res) {
        try {
            const numericId = req.user.userId || req.user.id;
            const user = await User.findOne({ id: numericId });

            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            // REMOVED: The token balance check that used to be right here

            const text = req.body.topic;
            if (!text) {
                return res.status(400).json({ error: 'Topic or content is required' });
            }
            
            // 1. Generate the quiz JSON via AI
            const generatedQuizJSON = await this.aiModel.generateQuiz(text);

            // 2. Generate a sequential quizID
            const latestQuiz = await Quiz.findOne().sort({ quizID: -1 }).exec();
            const nextQuizId = latestQuiz ? latestQuiz.quizID + 1 : 1;

            // 3. Save the new quiz to the database
            const savedQuiz = new Quiz({
                quizID: nextQuizId,
                studentID: numericId,
                title: generatedQuizJSON.title || "AI Generated Quiz",
                questions: generatedQuizJSON.questions
            });
            await savedQuiz.save();

            // REMOVED: The user.tokens -= 1 deduction that used to be here

            // 4. Return the newly SAVED database object to the frontend
            res.json({ quiz: savedQuiz });

        } catch(err) {
            console.error(err);
            res.status(500).json({ error: err.message || "Failed to generate quiz" });
        }
    }

    async generateHint(req, res) {
        try {
            const numericId = req.user.userId || req.user.id;
            const user = await User.findOne({ id: numericId });

            if (!user || user.tokens <= 0) {
                return res.status(403).json({ error: 'Insufficient tokens.' });
            }

            const { question, options } = req.body;
            
            // The prompt strictly tells Gemini to NOT give the answer away
            const prompt = `You are a helpful tutor. A student is struggling with this multiple choice question:\n\nQuestion: "${question}"\nOptions: ${options.join(', ')}\n\nProvide a short, educational hint that guides them toward the correct answer WITHOUT explicitly telling them which option is correct. Limit the hint to 2 sentences.`;

            const result = await this.aiModel.model.generateContent(prompt);
            const hint = result.response.text();

            // Deduct token
            user.tokens -= 1;
            await user.save();

            res.json({ hint: hint, tokensRemaining: user.tokens });
        } catch(err) {
            console.error(err);
            res.status(500).json({ error: "Failed to generate hint" });
        }
    }
}
module.exports = QuizGenerator;
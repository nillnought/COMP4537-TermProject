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

            if (!user || user.tokens <= 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const text = req.body.topic;
            // Capture the number of questions, default to 10 if missing
            const numQuestions = req.body.numQuestions || 10;

            if (!text) {
                return res.status(400).json({ error: 'Topic or content is required' });
            }

            // 1. Generate the quiz JSON via AI using the enriched prompt
            const enrichedPrompt = `Topic: ${text}\n\nIMPORTANT: You MUST generate EXACTLY ${numQuestions} multiple-choice questions for this quiz.`;
            const generatedQuizJSON = await this.aiModel.generateQuiz(enrichedPrompt);

            // 2. Generate a sequential quizID 
            // (Make sure this exact capitalization is maintained!)
            const latestQuiz = await Quiz.findOne().sort({ quizID: -1 }).exec();
            const nextQuizId = latestQuiz ? latestQuiz.quizID + 1 : 1;

            // 3. Save the new quiz to the database 
            // (Line 39 is likely right here)
            const savedQuiz = new Quiz({
                quizID: nextQuizId,
                teacherID: numericId,
                title: generatedQuizJSON.title || "AI Generated Quiz",
                questions: generatedQuizJSON.questions
            });
            user.tokens -= 1;
            await user.save();

            await savedQuiz.save();

            // 4. Return the newly SAVED database object to the frontend
            res.json({ quiz: savedQuiz });

        } catch (err) {
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
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to generate hint" });
        }
    }
}
module.exports = QuizGenerator;
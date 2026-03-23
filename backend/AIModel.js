const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIModel {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async generateQuiz(topic) {
        const prompt = `You are an AI that generates quizzes.

        Create a quiz based on the following content:

        ${topic}

        Return ONLY valid JSON. No markdown. No explanation.

        Format:
        {
            "title": "Quiz Title",
            "questions": [
                {
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"],
                    "correct": "A"
                }
            ]
    }`;

        const result = await this.model.generateContent(prompt);
        let resText = result.response.text();
        resText = this.cleanRes(resText);

        try {
            return JSON.parse(resText);
        } catch (err) {
            throw new Error("Couldn't parse to JSON");
        }

    }

    cleanRes(text) {
        return text.replace(/```json/g, ``).replace(/```/g, ``).trim();
    }
}

module.exports = AIModel;
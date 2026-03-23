const AIModel = require("./AIModel");


class QuizGenerator{
    constructor() {
        this.aiModel = new AIModel(process.env.API_KEY);
        this.generateQuiz = this.generateQuiz.bind(this);
    }

    async generateQuiz(req, res){
        try{
            const text = req.body.topic;
            
            const quiz = await this.aiModel.generateQuiz(text);
            res.json(quiz);
        } catch(err){
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
}
module.exports = QuizGenerator;
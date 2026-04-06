const backendURL = "http://localhost:8000";

class QuizApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.quizData = JSON.parse(localStorage.getItem('currentActiveQuiz'));
        
        if (!this.token || !this.quizData) {
            window.location.href = 'user-landing.html';
            return;
        }

        this.currentIndex = 0;
        this.score = 0;
        this.selectedAnswer = null;
        this.userAnswers = [];

        this.bindElements();
        this.attachListeners();
        this.init();
    }

    bindElements() {
        this.titleEl = document.getElementById('quiz-title');
        this.trackerEl = document.getElementById('question-tracker');
        this.questionEl = document.getElementById('question-text');
        this.optionsCont = document.getElementById('options-container');
        this.hintBox = document.getElementById('hint-box');
        
        this.nextBtn = document.getElementById('next-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.backBtn = document.getElementById('back-btn');
        this.tokenCountEl = document.getElementById('token-count');
    }

    attachListeners() {
        this.backBtn.addEventListener('click', () => window.location.href = 'user-landing.html');
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.hintBtn.addEventListener('click', () => this.getAIHint());
    }

    async init() {
        this.titleEl.textContent = this.quizData.title;
        await this.updateTokenBalance();
        this.renderQuestion();
    }

    async updateTokenBalance() {
        try {
            const res = await fetch(`${backendURL}/api/tokens/balance`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            this.tokenCountEl.textContent = data.tokens;
            
            // Disable hint button if out of tokens
            this.hintBtn.disabled = data.tokens <= 0;
        } catch (err) {
            console.error("Failed to fetch tokens", err);
        }
    }

    renderQuestion() {
        const qData = this.quizData.questions[this.currentIndex];
        this.selectedAnswer = null;
        this.hintBox.style.display = 'none';
        this.hintBox.textContent = '';
        
        this.trackerEl.textContent = `Question ${this.currentIndex + 1} of ${this.quizData.questions.length}`;
        this.questionEl.textContent = qData.question;
        this.optionsCont.innerHTML = '';

        qData.options.forEach(option => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = option;
            btn.addEventListener('click', () => this.selectOption(btn, option));
            this.optionsCont.appendChild(btn);
        });

        this.nextBtn.textContent = this.currentIndex === this.quizData.questions.length - 1 ? "Finish Quiz" : "Next Question";
    }

    selectOption(clickedBtn, option) {
        // Remove selected class from all buttons
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
        // Add to clicked button
        clickedBtn.classList.add('selected');
        this.selectedAnswer = option;
    }

    handleNext() {
        if (!this.selectedAnswer) {
            alert("Please select an answer first!");
            return;
        }

        const currentQuestionData = this.quizData.questions[this.currentIndex];
        const rawCorrect = currentQuestionData.correct;
        let fullCorrectText = rawCorrect; // Default to whatever the AI gave us

        // SMART CHECK: If the AI only gave us a letter like "B", 
        // hunt for the option that starts with "B)" or "B."
        const matchingOption = currentQuestionData.options.find(opt => 
            opt === rawCorrect || 
            opt.trim().startsWith(rawCorrect + ")") || 
            opt.trim().startsWith(rawCorrect + ".")
        );

        if (matchingOption) {
            fullCorrectText = matchingOption;
        } else if (rawCorrect.length === 1 && ["A", "B", "C", "D"].includes(rawCorrect.toUpperCase())) {
            // FALLBACK: If AI said "B" but the options don't have letters in front of them, 
            // just grab the 2nd option from the array (Index 1)
            const index = ["A", "B", "C", "D"].indexOf(rawCorrect.toUpperCase());
            if (currentQuestionData.options[index]) {
                fullCorrectText = currentQuestionData.options[index];
            }
        }

        // Now we can accurately check if the user's selected text matches the full correct text
        const isCorrect = (this.selectedAnswer === fullCorrectText) || (this.selectedAnswer === rawCorrect);

        // Save the full text for the final review screen!
        this.userAnswers.push({
            question: currentQuestionData.question,
            selected: this.selectedAnswer,
            correct: fullCorrectText, // This will now always be the full sentence
            isRight: isCorrect
        });

        if (isCorrect) {
            this.score++;
        }

        this.currentIndex++;

        if (this.currentIndex < this.quizData.questions.length) {
            this.renderQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        this.questionEl.textContent = "Quiz Complete!";
        this.trackerEl.textContent = "";

        // Build the top score header
        let resultsHTML = `<h3 style="text-align: center; color: var(--secondary-color); margin-bottom: 2rem;">You scored ${this.score} out of ${this.quizData.questions.length}!</h3>`;

        // Create a scrollable container for the review
        resultsHTML += `<div style="display: flex; flex-direction: column; gap: 1.5rem; text-align: left; max-height: 50vh; overflow-y: auto; padding-right: 1rem;">`;

        // Loop through the history and build the UI
        this.userAnswers.forEach((ans, index) => {
            const isCorrect = ans.isRight;
            
            // Use your theme's red/orange color for wrong, secondary green for right
            const statusColor = isCorrect ? 'var(--secondary-color)' : '#e76f51'; 

            resultsHTML += `
                <div style="padding: 1rem; border: 2px solid var(--main-shadow); border-radius: 0.5rem; background: white;">
                    <p style="font-weight: bold; color: var(--dark-text); margin-bottom: 0.5rem;">${index + 1}. ${ans.question}</p>
                    
                    <p style="color: ${statusColor}; margin-bottom: 0.25rem;">
                        <strong>Your Answer:</strong> ${ans.selected} ${isCorrect ? '✅' : '❌'}
                    </p>
                    
                    ${!isCorrect ? `<p style="color: var(--secondary-color); margin: 0;"><strong>Correct Answer:</strong> ${ans.correct}</p>` : ''}
                </div>
            `;
        });

        resultsHTML += `</div>`;

        this.optionsCont.innerHTML = resultsHTML;
        this.hintBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        
        // Update the top left button so it makes sense to leave the screen
        this.backBtn.textContent = "Return to Dashboard";

        createScore();
    }

    async getAIHint() {
        if (confirm("Are you sure you want to spend 1 token for a hint?")) {
            this.hintBtn.textContent = "Generating...";
            this.hintBtn.disabled = true;

            const qData = this.quizData.questions[this.currentIndex];

            try {
                const response = await fetch(`${backendURL}/api/quiz/hint`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ question: qData.question, options: qData.options })
                });

                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);

                this.tokenCountEl.textContent = data.tokensRemaining;
                this.hintBox.textContent = `💡 Hint: ${data.hint}`;
                this.hintBox.style.display = 'block';

            } catch (err) {
                alert(err.message || "Failed to get hint");
            } finally {
                this.hintBtn.textContent = "Ask AI Hint (1 Token)";
                if (parseInt(this.tokenCountEl.textContent) > 0) {
                    this.hintBtn.disabled = false;
                }
            }
        }
    }

    async createScore() {
        const userId = JSON.parse(localStorage.getItem('userId'));

        const response = await fetch(`${this.baseURL}/api/quiz/record-score`, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizId: this.quizData.quizId, studentId: userId, score: this.score })
        });
        
        data = await response.json();
        
        if (!response.ok) {
            throw new Error((data && data.error) || 'API Request Failed');
        }
        return data;
    }

}

document.addEventListener("DOMContentLoaded", () => {
    new QuizApp();
});
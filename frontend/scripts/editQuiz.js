class EditQuiz {
    constructor(){
        const params = new URLSearchParams(window.location.search);
        this.quizID = params.get("id");
        this.token = localStorage.getItem("token");
        this.backendURL = "https://thincutbacon.site";
        this.saveBtn = document.getElementById("save-quiz")
        this.saveBtn.addEventListener('click', this.saveQuiz.bind(this));
        document.getElementById("add-question").addEventListener("click", this.addQuestion.bind(this));
        document.getElementById("back-btn").addEventListener("click", this.goBack.bind(this));
        this.loadQuiz();
    }

    goBack(){
        window.location.href = "/user-landing.html";
    }

    async loadQuiz() {
        try {
            const res = await fetch(`${this.backendURL}/api/quiz/${this.quizID}`, {
                headers: {
                    "Authorization": `Bearer ${this.token}`
                }
            });
            const quiz = await res.json();

            if(!res.ok) {
                throw new Error(quiz.error);
            }

            this.populateQuiz(quiz);
        } catch(err){
            console.error(err);
        }
    }

    addQuestion() {
        const Qlist = document.getElementById("questions-list");
        const template = document.getElementById("question-template");

        const clone = template.content.cloneNode(true);

        const questionTxt = clone.querySelector(".question-txt");
        questionTxt.value = "";

        const optionsContainer = clone.querySelector(".question-options");
        optionsContainer.innerHTML = "";

        for (let i = 0; i < 4; i++) {
            const optionDiv = document.createElement("div");
            optionDiv.classList.add("option");

            optionDiv.innerHTML = `
            <input type="checkbox">
            <span contenteditable="true">Option</span>
        `;

            optionsContainer.appendChild(optionDiv);
        }
        const questionWrap = clone.querySelector(".question-wrap");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Remove";
        deleteBtn.classList.add("delete-question");

        deleteBtn.addEventListener("click", () => {
            questionWrap.remove();
        });

        questionWrap.appendChild(deleteBtn);

        Qlist.appendChild(clone);
        setTimeout(() => {
            Qlist.lastElementChild
                .querySelector(".question-txt")
                .focus();
        }, 0);
    }


    populateQuiz(quiz){
        document.getElementById("quiz-title").value = quiz.title;
        const normalize = (str) => str.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');

        const Qlist = document.getElementById("questions-list");
        Qlist.innerHTML = "";

        const template = document.getElementById("question-template");
        quiz.questions.forEach(q => {
            const clone = template.content.cloneNode(true);

            const questionTxt = clone.querySelector(".question-txt");
            questionTxt.value = q.question;

            const optionsContainer = clone.querySelector(".question-options");

            q.options.forEach(opt => {
                const optionDiv = document.createElement("div");
                optionDiv.classList.add("option");

                optionDiv.innerHTML = `
        <input type="checkbox" ${normalize(opt) === normalize(q.correct) ? "checked" : ""}>
        <span contenteditable="true">${opt}</span>
    `;

                optionsContainer.appendChild(optionDiv);
            });
            const questionWrap = clone.querySelector(".question-wrap");
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.add("delete-question");

            deleteBtn.addEventListener("click", () => {
                questionWrap.remove();
            });

            questionWrap.appendChild(deleteBtn);
            Qlist.appendChild(clone);
        });
    }

    getQuizData(){
        const title = document.getElementById("quiz-title").value;
        const questionEles = document.querySelectorAll(".question-wrap");

        const questions = [];

        questionEles.forEach(ele => {
            const questionText = ele.querySelector(".question-txt").value;
            const optionEles = ele.querySelectorAll(".option");

            const options = [];
            let correct = null;

            optionEles.forEach(op => {
                const text = op.querySelector("span").textContent.trim();
                const checked = op.querySelector("input").checked;
                options.push(text);
                if (checked) {
                    correct = text;
                }
            });

            questions.push({
                question: questionText,
                options,
                correct
            });
        });
        return {title, questions};
    }

    async saveQuiz() {
        const data = this.getQuizData();
        try{
            const res = await fetch(`${this.backendURL}/api/quiz/${this.quizID}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if(!res.ok) {
                throw new Error(result.error);
            }
            this.saveBtn.innerText = "Saved!";
            setTimeout(() => {
                this.saveBtn.innerText = "Save";
            }, 1000)

        } catch(err) {
            console.error(err);
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new EditQuiz();
});
const backendURL = "http://localhost:8000";

const token = localStorage.getItem('token');
const userType = localStorage.getItem('userType');
if (!token || userType !== 'user') {
    window.location.href = '/register.html';
}

document.getElementById('signout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
});


document.getElementById("create-class").addEventListener('click', AddClass);
document.getElementById("create-quiz").addEventListener('click', quizPrompt);

function AddClass() {
    document.getElementById("no-classes").style.display = "none";
    const classList = document.getElementById("class-list");
    const templateClone = document.getElementById("class-template").content.cloneNode(true);

    classList.appendChild(templateClone);
}

const popUp = document.getElementById("pop-up");
popUp.addEventListener('click', () => {
    popUp.style.display = "none";
});
const popUpBox = document.getElementById("pop-up-box");

popUpBox.addEventListener('click', (e) => {
    e.stopPropagation();
});

function quizPrompt() {
    popUp.style.display = "flex";
}

document.getElementById("quiz-form").addEventListener("submit", createQuiz);


async function createQuiz(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const topic = document.getElementById("quiz-text").value;

    if (!topic) {
        alert("Please enter a topic");
        return;
    }

    try {
        const balanceRes = await fetch(`${backendURL}/api/tokens/balance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const balanceData = await balanceRes.json();

        if (balanceData.tokens <= 0) {
            alert("You have 0 tokens! Please contact an admin to add more.");
            return;
        }
        const res = await fetch(`${backendURL}/api/quiz/generate-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ topic })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to generate quiz");
        }
        const useTokenRes = await fetch(`${backendURL}/api/tokens/use`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!useTokenRes.ok) {
            const tokenErr = await useTokenRes.json();
            console.warn("Quiz generated, but failed to deduct token:", tokenErr.error);
        } else {
            const tokenData = await useTokenRes.json();
            console.log(`Token deducted! Remaining: ${tokenData.tokensRemaining}`);
        }

        console.log("Quiz:", data);

        renderQuiz(data);

        popUp.style.display = "none";

        document.getElementById("quiz-text").value = "";

    } catch (err) {
        console.error(err);
        alert("Error generating quiz");
    }
}

function renderQuiz(quiz) {
    const quizList = document.getElementById("quiz-list");

    const quizDiv = document.createElement("div");
    quizDiv.classList.add("class-box");

    quizDiv.innerHTML = `
        <h4>${quiz.title}</h4>
        <p>${quiz.questions.length} Questions</p>
    `;

    quizList.appendChild(quizDiv);
}
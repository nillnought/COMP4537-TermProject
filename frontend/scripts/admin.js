const token = localStorage.getItem('token');
const userType = localStorage.getItem('userType');
if (!token || userType !== 'admin') {
    window.location.href = '/register.html';
}

document.getElementById('signout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', async() =>{
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (!token || userType !== 'admin') {
        window.location.href = '/register.html';
    }

    document.getElementById('signout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('userId');
        window.location.href = '/';
    });
    try {
        const res = await fetch(`${backendURL}/api/admin/user-tokens`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch users', res.err);
        }

        const users = await res.json();

        // Render users
        const container = document.getElementById('user-list');
        container.innerHTML = '';

        users.forEach(user => {
            const div = document.createElement('div');
            div.classList.add('user-row');

            div.innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Current Tokens:</strong> <span id="token-count-${user.id}">${user.tokens ?? 0}</span></p>
        <div class="admin-actions">
            <input type="number" id="input-${user.id}" placeholder="Amt" style="width: 60px;">
            <button onclick="addTokens('${user.id}')">Add Tokens</button>
        </div>
        <hr/>
    `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
    }
});


async function addTokens(targetUserId) {
    const amount = document.getElementById(`input-${targetUserId}`).value;
    const token = localStorage.getItem('token');

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    try {
        const res = await fetch(`${backendURL}/api/admin/add-tokens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetUserId: targetUserId,
                amount: parseInt(amount)
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to update tokens');


        document.getElementById(`token-count-${targetUserId}`).innerText = data.newTotal;
        document.getElementById(`input-${targetUserId}`).value = '';
        alert('Tokens added successfully!');

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
// document.getElementById("create-class").addEventListener('click', AddClass);
// document.getElementById("create-quiz").addEventListener('click', quizPrompt);

// function AddClass() {
//     document.getElementById("no-classes").style.display = "none";
//     const classList = document.getElementById("class-list");
//     const templateClone = document.getElementById("class-template").content.cloneNode(true);

//     classList.appendChild(templateClone);
// }

// const popUp = document.getElementById("pop-up");
// popUp.addEventListener('click', () => {
//         popUp.style.display = "none";
// });
// const popUpBox = document.getElementById("pop-up-box");

// popUpBox.addEventListener('click', (e) => {
//     e.stopPropagation();
// });

// function quizPrompt(){
//     popUp.style.display = "flex";
// }

// document.getElementById("quiz-form").addEventListener("submit", createQuiz);

const backendURL = "http://localhost:8000";

// async function createQuiz(e) {
//     e.preventDefault();

//     const token = localStorage.getItem('token');
//     const topic = document.getElementById("quiz-text").value;

//     if (!topic) {
//         alert("Please enter a topic");
//         return;
//     }

//     try {
//         const res = await fetch(`${backendURL}/api/quiz/generate-quiz`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ topic })
//         });

//         const data = await res.json();

//         if (!res.ok) {
//             throw new Error(data.error || "Failed to generate quiz");
//         }

//         console.log("Quiz:", data);

//         renderQuiz(data);

//         popUp.style.display = "none";

//         document.getElementById("quiz-text").value = "";

//     } catch (err) {
//         console.error(err);
//         alert("Error generating quiz");
//     }
// }

// function renderQuiz(quiz) {
//     const quizList = document.getElementById("quiz-list");

//     const quizDiv = document.createElement("div");
//     quizDiv.classList.add("class-box");

//     quizDiv.innerHTML = `
//         <h4>${quiz.title}</h4>
//         <p>${quiz.questions.length} Questions</p>
//     `;

//     quizList.appendChild(quizDiv);
// }
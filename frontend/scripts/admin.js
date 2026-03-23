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
document.getElementById("create-class").addEventListener('click', AddClass);
document.getElementById("create-quiz").addEventListener('click', quizPrompt);

function AddClass() {
    document.getElementById("no-classes").style.display = "none";
    const classList = document.getElementById("class-list");
    const templateClone = document.getElementById("class-template").content.cloneNode(true);

    classList.appendChild(templateClone);
}

function createQuiz(){

}

const popUp = document.getElementById("pop-up");
popUp.addEventListener('click', () => {
        popUp.style.display = "none";
});
const popUpBox = document.getElementById("pop-up-box");

popUpBox.addEventListener('click', (e) => {
    e.stopPropagation();
});

function quizPrompt(){
    popUp.style.display = "flex";
}
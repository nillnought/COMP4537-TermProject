const usernameEle = document.getElementById("username");
const passwordEle = document.getElementById("password");

const submitBtn = document.getElementById("submit-btn");

submitBtn.addEventListener("click", processForm);

function processForm(){
    const username = usernameEle.value;
    const password = passwordEle.value;

    console.log(username);
    console.log(password);
}
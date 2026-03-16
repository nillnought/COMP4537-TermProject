const usernameEle = document.getElementById("username");
const passwordEle = document.getElementById("password");

const inputWrap = document.getElementById("form-input-wrap");

const switchEle = document.getElementById("switch");
const forgotEle = document.getElementById("forgot");

const submitBtn = document.getElementById("submit-btn");

let LogIn = true;

submitBtn.addEventListener("click", processForm);

switchEle.addEventListener("click", switchLogIn);

// Move to a Lang file later
const LogInFields = `<input placeholder="Email" class="form-input" id="username"
                    type="email" required>
                    <input placeholder="Password" class="form-input" type="password" id="password" required>`;

const SignUpFields = `<input placeholder="Email" class="form-input" id="username"
                    type="email" required>
                    <input placeholder="Password" class="form-input" type="password" id="password" required>
                    <input placeholder="Confirm password" class="form-input" type="password" id="password" required>`;

const LogInMsg = "Have an account?";
const SignUpMsg = "Don't have an account?";

function processForm(){
    const username = usernameEle.value;
    const password = passwordEle.value;

    console.log(username);
    console.log(password);
}

function validateLogin(username, password){
// placeholder, will put checking logic here later
}

function switchLogIn(){
    LogIn = !LogIn;
    if(LogIn){
        inputWrap.innerHTML = LogInFields;
        switchEle.textContent = SignUpMsg;
        forgotEle.style = "";
    } else {
        inputWrap.innerHTML = SignUpFields;
        switchEle.textContent = LogInMsg;
        forgotEle.style.display = "none";
    }
}
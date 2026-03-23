
class AuthForm {
  constructor() {
    this.inputWrap = document.getElementById('form-input-wrap');
    this.switchEle = document.getElementById('switch');
    this.forgotEle = document.getElementById('forgot');
    this.submitBtn = document.getElementById('submit-btn');
    this.roleWrap = document.getElementById('role-wrap');
    this.loginMode = true;
    this.backendURL = "https://thincutbacon.site";

    this.loginFields = `\n      <input placeholder="Email" class="form-input" id="username" type="email" required>\n      <input placeholder="Password" class="form-input" id="password" type="password" required>`;

    this.signupFields = `\n      <input placeholder="Email" class="form-input" id="username" type="email" required>\n      <input placeholder="Password" class="form-input" id="password" type="password" required>\n      <input placeholder="Confirm password" class="form-input" id="confirmPass" type="password" required>`;

    this.switchEle.textContent = "Don't have an account?";
    this.submitBtn.addEventListener('click', () => this.processForm());
    this.switchEle.addEventListener('click', () => this.switchMode());
  }

  async processForm() {
    const email = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value?.trim();

    if (!email || !password) {
      alert('Email and password are required');
      return;
    }

    if (this.loginMode) {
      await this.validateLogin(email, password);
      return;
    }

    const confirmPass = document.getElementById('confirmPass')?.value?.trim();
    if (password !== confirmPass) {
      alert('Passwords do not match');
      return;
    }

    const type = document.querySelector('input[name="role"]:checked')?.value || 'user';
    await this.validateRegistration(email, password, type);
  }

  async validateRegistration(email, password, type) {
    const res = await fetch(`${this.backendURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, type }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Registration failed');
      return;
    }

    alert('Registration successful, please log in');
    this.switchMode(true); // go to login mode
  }

  async validateLogin(email, password) {
    const res = await fetch(`${this.backendURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', data.type);
    localStorage.setItem('userId', data.userId);

    if (data.type === 'admin') {
      window.location.href = 'admin-landing';
    } else {
      window.location.href = 'user-landing';
    }
  }

  switchMode() {
    this.loginMode = !this.loginMode;

    if (this.loginMode) {
      this.inputWrap.innerHTML = this.loginFields;
      this.switchEle.textContent = "Don't have an account?";
      this.forgotEle.style.display = 'flex';
    } else {
      this.inputWrap.innerHTML = this.signupFields;
      this.switchEle.textContent = 'Have an account?';
      this.forgotEle.style.display = 'none';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new AuthForm());

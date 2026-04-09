
class AuthForm {
  constructor() {
    this.inputWrap = document.getElementById('form-input-wrap');
    this.switchEle = document.getElementById('switch');
    this.forgotEle = document.getElementById('forgot');
    this.submitBtn = document.getElementById('submit-btn');
    this.roleWrap = document.getElementById('role-wrap');
    this.loginMode = true;
    // this.backendURL = "http://localhost:8000";
    this.backendURL = "https://thincutbacon.site";

    this.loginFields = `
      <input placeholder="Email" class="form-input" id="username" type="email" required>
      <input placeholder="Password" class="form-input" id="password" type="password" required>`;

    this.signupFields = `
      <input placeholder="Email" class="form-input" id="username" type="email" required>
      <input placeholder="Password" class="form-input" id="password" type="password" required>
      <input placeholder="Confirm password" class="form-input" id="confirmPass" type="password" required>
      <div style="width: 100%;">
        <label style="color: var(--accent-text); font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">I am a...</label>
        <div class="role-toggle" style="display: flex; gap: 0.5rem; width: 100%;">
          <label style="flex: 1; padding: 0.6rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; text-align: center; background: var(--secondary-color); color: var(--light-text); border: none; transition: all 0.2s ease;">
            <input type="radio" name="role" value="student" checked required>
            Student
          </label>
          <label style="flex: 1; padding: 0.6rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; text-align: center; background: var(--main-highlight); color: var(--dark-text); border: 2px solid var(--secondary-shadow); transition: all 0.2s ease;">
            <input type="radio" name="role" value="teacher" required>
            Teacher
          </label>
        </div>
      </div>`;

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

    const role = document.querySelector('input[name="role"]:checked')?.value || 'student';
    await this.validateRegistration(email, password, role);
  }

  async validateRegistration(email, password, role) {
    console.log('Registering with role:', role); 
    console.log('Backend URL:', this.backendURL);
    
    try {
      const res = await fetch(`${this.backendURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      console.log('Registration response:', data);
      
      if (!res.ok) {
        alert(data.error || 'Registration failed');
        return;
      }

      alert('Registration successful, please log in');
      this.switchMode(true); // go to login mode
    } catch (err) {
      console.error('Registration error:', err);
      alert('Error: ' + err.message);
    }
  }

  async validateLogin(email, password) {
    console.log('Attempting login to:', this.backendURL);
    
    try {
      const res = await fetch(`${this.backendURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Login response:', data);
      
      if (!res.ok) {
        alert(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', data.type);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.userId);

      const roleText = data.type === 'admin' ? 'Admin' : (data.role === 'teacher' ? 'Teacher' : 'Student');
      this.submitBtn.textContent = `Welcome back, ${roleText}!`;
      this.submitBtn.disabled = true;

      setTimeout(() => {
        if (data.type === 'admin') {
          window.location.href = 'admin-landing.html';
        } else if (data.role === 'teacher') {
          window.location.href = 'user-landing.html';
        } else {
          window.location.href = 'user-landing.html';
        }
      }, 800);
    } catch (err) {
      console.error('Login error:', err);
      alert('Error: ' + err.message);
    }
  }

  switchMode() {
    this.loginMode = !this.loginMode;

    if (this.loginMode) {
      this.inputWrap.innerHTML = this.loginFields;
      this.switchEle.textContent = "Don't have an account?";
      if (this.forgotEle) {
        this.forgotEle.style.display = 'flex';
      }
    } else {
      this.inputWrap.innerHTML = this.signupFields;
      this.switchEle.textContent = 'Have an account?';
      if (this.forgotEle) {
        this.forgotEle.style.display = 'none';
      }
      
      setTimeout(() => {
        this.initializeRoleButtons();
      }, 10);
    }
  }

  initializeRoleButtons() {
    try {
      const roleInputs = document.querySelectorAll('input[name="role"]');
      const roleLabels = document.querySelectorAll('.role-toggle label');

      if (!roleInputs.length || !roleLabels.length) {
        console.error('Role inputs or labels not found');
        return;
      }

      roleInputs.forEach((input, index) => {
        // Add change listener
        input.addEventListener('change', (e) => {
          console.log('Role selected:', e.target.value); // Debug log
          roleLabels.forEach(label => label.classList.remove('role-selected'));
          roleLabels[index].classList.add('role-selected');
        });

        // Set initial styling if already checked
        if (input.checked) {
          roleLabels[index].classList.add('role-selected');
        }
      });
      console.log('Role buttons initialized successfully');
    } catch (err) {
      console.error('Error initializing role buttons:', err);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new AuthForm());

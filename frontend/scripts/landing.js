/**
 * Helper function to decode JWT token
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (err) {
        console.error('Error decoding token:', err);
        return null;
    }
}

/**
 * Main Landing Page Controller
 */
class LandingPage {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userType = null;
        this.init();
    }

    async init() {
        // Verify token exists
        if (!this.token) {
            window.location.href = '/';
            return;
        }

        // Decode JWT to get user type and role
        const decodedToken = decodeJWT(this.token);
        if (!decodedToken || !decodedToken.type) {
            console.error('Invalid token');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        this.userType = decodedToken.type;
        this.userRole = decodedToken.role;

        // Handle superadmin redirect
        if (this.userType === 'admin') {
            window.location.href = '/admin-landing';
            return;
        }

        // Display appropriate view based on role for regular users
        if (this.userRole === 'teacher') {
            this.showTeacherView();
        } else {
            this.showStudentView();
        }

        // Populate role badge
        const roleBadge = document.getElementById('role-badge');
        if (roleBadge) {
            roleBadge.textContent = this.userRole === 'teacher' ? 'Teacher' : 'Student';
        }

        // Bind common elements
        this.bindCommonElements();
    }

    bindCommonElements() {
        const signOutBtn = document.getElementById('signout');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
    }

    showStudentView() {
        const studentView = document.getElementById('student-view');
        const teacherView = document.getElementById('teacher-view');

        if (studentView) studentView.style.display = 'block';
        if (teacherView) teacherView.style.display = 'none';

        // student view is shown, no modal bindings here
    }

    showTeacherView() {
        const studentView = document.getElementById('student-view');
        const teacherView = document.getElementById('teacher-view');

        if (studentView) studentView.style.display = 'none';
        if (teacherView) teacherView.style.display = 'block';
    }

    signOut() {
        localStorage.clear();
        window.location.href = '/';
    }
}

// Initialize landing page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();
});

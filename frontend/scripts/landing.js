class LandingPage {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userType = localStorage.getItem('userType');
        this.userRole = localStorage.getItem('userRole');
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '/';
            return;
        }

        if (this.userType === 'admin') {
            window.location.href = '/admin-landing';
            return;
        }

        if (this.userRole === 'teacher') {
            this.showTeacherView();
        } else {
            this.showStudentView();
        }

        const roleBadge = document.getElementById('role-badge');
        if (roleBadge) {
            roleBadge.textContent = this.userRole === 'teacher' ? 'Teacher' : 'Student';
        }

        const signOutBtn = document.getElementById('signout');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
    }

    showStudentView() {
        document.getElementById('student-view').style.display = 'block';
        document.getElementById('teacher-view').style.display = 'none';
    }

    showTeacherView() {
        document.getElementById('student-view').style.display = 'none';
        document.getElementById('teacher-view').style.display = 'block';
    }

    signOut() {
        localStorage.clear();
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => new LandingPage());
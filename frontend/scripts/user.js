const backendURL = "http://localhost:8000";
// const backendURL = "https://thincutbacon.site";

class APIService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('token');
    }

    getHeaders() {
        return { 'Authorization': `Bearer ${this.token}` };
    }

    async handleResponse(response) {
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/';
            throw new Error('Unauthorized');
        }
        let data;
        try {
            data = await response.json();
        } catch (err) {
            data = null;
        }
        if (!response.ok) {
            throw new Error((data && data.error) || 'API Request Failed');
        }
        return data;
    }

    async generateQuizFromText(topic, numQuestions) {
        const response = await fetch(`${this.baseURL}/api/quiz/generate-quiz`, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            // Send numQuestions in the JSON payload
            body: JSON.stringify({ topic, numQuestions })
        });
        return this.handleResponse(response);
    }

    async generateQuizFromPDF(file, numQuestions) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('numQuestions', numQuestions);
        const response = await fetch(`${this.baseURL}/api/quiz/generate-from-pdf`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: formData
        });
        return this.handleResponse(response);
    }

    async createClass(className) {
        const response = await fetch(`${this.baseURL}/api/classes/create`, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: className })
        });
        return this.handleResponse(response);
    }

    async fetchMyClasses() {
        const response = await fetch(`${this.baseURL}/api/classes/my-classes`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async assignQuizToClass(classID, quizID) {
        const response = await fetch(`${this.baseURL}/api/classes/${classID}/assign-quiz`, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizID })
        });
        return this.handleResponse(response);
    }

    async joinClass(entryCode) {
        const response = await fetch(`${this.baseURL}/api/classes/join`, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ entryCode: String(entryCode) })
        });
        return this.handleResponse(response);
    }

    async fetchMyQuizzes() {
        const response = await fetch(`${this.baseURL}/api/quiz/my-quizzes`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async fetchClassRoster(classID) {
        const response = await fetch(`${this.baseURL}/api/classes/${classID}/students`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
}

class DashboardUI {

    constructor(apiService) {
        this.api = apiService;
        this.role = localStorage.getItem('userRole');
        this.selectedAssignClassID = null;
        this.classes = [];
        this.classMap = {};
        this.quizzes = [];
        this.bindElements();
        this.attachEventListeners();
        this.init();
    }

    async init() {
        try {
            const [classes, quizzes] = await Promise.all([
                this.api.fetchMyClasses(),
                this.api.fetchMyQuizzes()
            ]);

            this.classes = classes || [];
            this.quizzes = quizzes || [];
            this.classMap = this.classes.reduce((map, classData) => {
                map[classData.classID] = classData;
                return map;
            }, {});

            if (this.role === 'teacher') {
                this.renderTeacherDashboard();
            } else {
                this.renderStudentDashboard();
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        }
    }

    bindElements() {
        // Modals
        this.quizModal = document.getElementById('pop-up');
        this.joinClassModal = document.getElementById('join-class-pop-up');
        this.classModal = document.getElementById('class-pop-up');
        this.teacherQuizModal = document.getElementById('teacher-pop-up');
        this.assignQuizModal = document.getElementById('assign-quiz-pop-up');
        this.rosterModal = document.getElementById('roster-pop-up');
        this.rosterModalTitle = document.getElementById('roster-modal-title');
        this.rosterList = document.getElementById('roster-list');

        // Student forms & inputs
        this.quizForm = document.getElementById('quiz-form');
        this.quizInput = document.getElementById('quiz-text');
        this.numQuestionsInput = document.getElementById('num-questions');
        this.fileInput = document.getElementById('file-input');
        this.fileNameDisplay = document.getElementById('file-name-display');

        this.joinClassForm = document.getElementById('join-class-form');
        this.joinClassCodeInput = document.getElementById('join-class-code');

        // Teacher forms & inputs
        this.classForm = document.getElementById('class-form');
        this.classNameInput = document.getElementById('class-name-input');

        this.teacherQuizForm = document.getElementById('teacher-quiz-form');
        this.teacherQuizText = document.getElementById('teacher-quiz-text');
        this.teacherNumQuestionsInput = document.getElementById('teacher-num-questions');
        this.teacherFileInput = document.getElementById('teacher-file-input');
        this.teacherFileNameDisplay = document.getElementById('teacher-file-name-display');

        this.assignQuizTitle = document.getElementById('assign-quiz-title');
        this.assignQuizList = document.getElementById('assign-quiz-list');

        // Lists
        this.quizList = document.getElementById('quiz-list');
        this.classList = document.getElementById('class-list');
        this.noClassesText = document.getElementById('no-classes');
        this.teacherClassList = document.getElementById('teacher-class-list');
        this.teacherQuizList = document.getElementById('teacher-quiz-list');
        this.noTeacherClassesText = document.getElementById('no-teacher-classes');
        this.noTeacherQuizzesText = document.getElementById('no-teacher-quizzes');
    }

    attachEventListeners() {
        const on = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        };

        on('signout', 'click', () => this.signOut());
        on('create-class', 'click', () => this.toggleModal(this.classModal, true));
        on('close-class-modal', 'click', () => this.toggleModal(this.classModal, false));
        on('create-quiz', 'click', () => this.toggleModal(this.quizModal, true));
        on('close-quiz-modal', 'click', () => this.toggleModal(this.quizModal, false));
        on('join-class', 'click', () => this.toggleModal(this.joinClassModal, true));
        on('close-join-class-modal', 'click', () => this.toggleModal(this.joinClassModal, false));
        on('create-teacher-quiz', 'click', () => this.toggleModal(this.teacherQuizModal, true));
        on('close-teacher-quiz-modal', 'click', () => this.toggleModal(this.teacherQuizModal, false));
        on('close-assign-quiz-modal', 'click', () => this.toggleModal(this.assignQuizModal, false));
        on('close-roster-modal', 'click', () => this.toggleModal(this.rosterModal, false));

        on('quiz-form', 'submit', (e) => this.handleQuizSubmit(e));
        on('class-form', 'submit', (e) => this.handleClassSubmit(e));
        on('join-class-form', 'submit', (e) => this.handleJoinClassSubmit(e));
        on('teacher-quiz-form', 'submit', (e) => this.handleTeacherQuizSubmit(e));

        on('file-input', 'change', () => this.updateFileName(this.fileInput, this.fileNameDisplay));
        on('teacher-file-input', 'change', () => this.updateFileName(this.teacherFileInput, this.teacherFileNameDisplay));
    }

    renderTeacherDashboard() {
        this.classes.forEach((c) => this.renderTeacherClassCard(c));
        if (this.classes.length === 0 && this.noTeacherClassesText)
            this.noTeacherClassesText.style.display = 'flex';

        this.quizzes.forEach((q) => this.renderTeacherQuizCard(q));
        if (this.quizzes.length === 0 && this.noTeacherQuizzesText)
            this.noTeacherQuizzesText.style.display = 'flex';
    }

    renderStudentDashboard() {
        this.classes.forEach((c) => this.renderStudentClassCard(c));
        if (this.classes.length === 0 && this.noClassesText)
            this.noClassesText.style.display = 'flex';

        if (this.quizzes.length === 0) {
            this.quizList.innerHTML = '<div><h4>No quizzes yet...</h4></div>';
        } else {
            this.quizzes.forEach((q) => this.renderStudentQuizCard(q));
        }
    }

    renderStudentClassCard(classData) {
        const classDiv = document.createElement('div');
        classDiv.classList.add('class-box');
        classDiv.innerHTML = `
            <h4 class="class-name">${classData.name || 'Unnamed Class'}</h4>
            <p class="class-size">Code: ${classData.entryCode}</p>
        `;
        this.classList.appendChild(classDiv);
    }

    renderTeacherClassCard(classData) {
        const classDiv = document.createElement('div');
        classDiv.classList.add('class-box');
        classDiv.innerHTML = `
            <h4 class="class-name">${classData.name || 'Unnamed Class'}</h4>
            <p class="class-size" style="font-size: 1rem;">Share code: <strong>${classData.entryCode}</strong></p>
            <p class="class-size">${classData.students?.length || 0} Students</p>
        `;

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;';

        const assignBtn = document.createElement('button');
        assignBtn.className = 'submit-btn';
        assignBtn.textContent = 'Assign Quiz';
        assignBtn.style.flex = '1';
        assignBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openAssignQuizModal(classData);
        });

        const rosterBtn = document.createElement('button');
        rosterBtn.className = 'cancel-btn';
        rosterBtn.textContent = 'View Roster';
        rosterBtn.style.flex = '1';
        rosterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openRosterModal(classData);
        });

        btnGroup.appendChild(assignBtn);
        btnGroup.appendChild(rosterBtn);
        classDiv.appendChild(btnGroup);
        this.teacherClassList.appendChild(classDiv);
    }

    renderStudentQuizCard(quiz) {
        const quizDiv = document.createElement('div');
        quizDiv.classList.add('class-box');
        const questionCount = quiz.questions ? quiz.questions.length : 0;
        const classLabel = quiz.classID && this.classMap[quiz.classID]
            ? this.classMap[quiz.classID].name : 'No class';

        quizDiv.innerHTML = `
            <h4 class="class-name">${quiz.title || 'Generated Quiz'}</h4>
            <p class="class-size">${questionCount} Questions · ${classLabel}</p>
        `;
        quizDiv.addEventListener('click', () => {
            localStorage.setItem('currentActiveQuiz', JSON.stringify(quiz));
            window.location.href = '/take-quiz.html';
        });
        this.quizList.appendChild(quizDiv);
    }

    renderTeacherQuizCard(quiz) {
        const quizDiv = document.createElement('div');
        quizDiv.classList.add('class-box');
        const createdDate = new Date(quiz.createdAt).toLocaleDateString();

        quizDiv.innerHTML = `
            <h4 class="class-name">${quiz.title || 'Generated Quiz'}</h4>
            <p class="class-size">Created: ${createdDate}</p>
        `;
        // for teachers to edit quizzes
        quizDiv.addEventListener('click', () => {
            window.location.href = `/frontend/editQuiz.html?id=${quiz.quizID}`
        });
        this.teacherQuizList.appendChild(quizDiv);
    }

    toggleModal(modalElement, show) {
        if (!modalElement) return;
        modalElement.style.display = show ? 'flex' : 'none';
        if (!show) {
            this.clearError(modalElement);
            if (modalElement === this.quizModal) {
                this.quizInput.value = '';
                this.fileInput.value = '';
                this.fileNameDisplay.textContent = '';
            }
            if (modalElement === this.teacherQuizModal) {
                this.teacherQuizText.value = '';
                this.teacherFileInput.value = '';
                this.teacherFileNameDisplay.textContent = '';
            }
            if (modalElement === this.classModal) {
                this.classNameInput.value = '';
            }
            if (modalElement === this.joinClassModal) {
                this.joinClassCodeInput.value = '';
            }
            if (modalElement === this.assignQuizModal) {
                this.assignQuizList.innerHTML = '';
            }
        }
    }

    openAssignQuizModal(classData) {
        if (!this.assignQuizModal || !this.assignQuizList) return;

        this.selectedAssignClassID = classData.classID;
        this.assignQuizTitle.textContent = `Assign Quiz to ${classData.name}`;
        this.assignQuizList.innerHTML = '';
        this.clearError(this.assignQuizModal);

        if (!this.quizzes.length) {
            this.assignQuizList.innerHTML = '<div><h4>No quizzes available</h4></div>';
        } else {
            this.quizzes.forEach((quiz) => {
                const row = document.createElement('div');
                row.classList.add('class-box');
                row.style.width = '100%';
                row.style.flexDirection = 'column';
                row.innerHTML = `
                    <div>
                      <h4 class="class-name">${quiz.title || 'Untitled Quiz'}</h4>
                      <p class="class-size">Questions: ${quiz.questions?.length || 0}</p>
                    </div>
                `;

                const assignBtn = document.createElement('button');
                assignBtn.className = 'submit-btn';
                assignBtn.textContent = quiz.classID === this.selectedAssignClassID ? 'Assigned' : 'Assign';
                assignBtn.disabled = quiz.classID === this.selectedAssignClassID;
                assignBtn.addEventListener('click', async () => {
                    assignBtn.disabled = true;
                    assignBtn.textContent = 'Assigning...';
                    try {
                        await this.api.assignQuizToClass(this.selectedAssignClassID, quiz.quizID);
                        quiz.classID = this.selectedAssignClassID;
                        assignBtn.textContent = 'Assigned';
                        this.clearError(this.assignQuizModal);
                    } catch (err) {
                        assignBtn.textContent = 'Assign';
                        assignBtn.disabled = false;
                        this.showError(this.assignQuizModal, err.message || 'Failed to assign quiz');
                    }
                });

                row.appendChild(assignBtn);
                this.assignQuizList.appendChild(row);
            });
        }

        this.toggleModal(this.assignQuizModal, true);
    }

    async openRosterModal(classData) {
        if (!this.rosterModal) return;

        this.rosterModalTitle.textContent = `Roster — ${classData.name}`;
        this.rosterList.innerHTML = '<p style="text-align:center; color: var(--accent-text);">Loading...</p>';
        this.toggleModal(this.rosterModal, true);

        try {
            const students = await this.api.fetchClassRoster(classData.classID);
            this.rosterList.innerHTML = '';

            if (!students.length) {
                this.rosterList.innerHTML = '<p style="text-align:center; color: var(--accent-text);">No students enrolled yet.</p>';
                return;
            }

            students.forEach((student, index) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0.25rem; border-bottom:1px solid var(--main-shadow);';
                row.innerHTML = `
                    <span style="font-weight:600; color:var(--accent-text); min-width:1.5rem;">${index + 1}.</span>
                    <span style="color:var(--dark-text);">${student.email}</span>
                `;
                this.rosterList.appendChild(row);
            });
        } catch (err) {
            this.rosterList.innerHTML = `<p style="text-align:center; color:#e76f51;">${err.message || 'Failed to load roster.'}</p>`;
        }
    }

    async handleClassSubmit(e) {
        e.preventDefault();
        this.clearError(this.classModal);
        const className = this.classNameInput.value.trim();
        const submitBtn = this.classForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const newClass = await this.api.createClass(className);
            this.classes.unshift(newClass);
            this.classMap[newClass.classID] = newClass;
            this.renderTeacherClassCard(newClass);
            this.toggleModal(this.classModal, false);
        } catch (err) {
            this.showError(this.classModal, err.message || 'Failed to create class');
        } finally {
            submitBtn.disabled = false;
        }
    }

    async handleQuizSubmit(e) {
        e.preventDefault();
        const topic = this.quizInput.value.trim();
        const file = this.fileInput.files[0];
        const numQuestions = parseInt(this.numQuestionsInput.value, 10);

        if (!topic && !file) {
            alert('Please enter a course topic OR select a PDF document.');
            return;
        }
        if (numQuestions < 5 || numQuestions > 50) {
            alert('Please select between 5 and 50 questions.');
            return;
        }

        const submitBtn = document.getElementById('generate-quiz');
        submitBtn.textContent = 'Generating... Please wait';
        submitBtn.disabled = true;

        try {
            const response = file
                ? await this.api.generateQuizFromPDF(file, numQuestions)
                : await this.api.generateQuizFromText(topic, numQuestions);

            this.quizzes.unshift(response.quiz);
            this.renderStudentQuizCard(response.quiz);
            this.toggleModal(this.quizModal, false);
        } catch (err) {
            this.showError(this.quizModal, err.message || 'Failed to generate quiz');
        } finally {
            submitBtn.textContent = 'Generate quiz';
            submitBtn.disabled = false;
        }
    }

    async handleJoinClassSubmit(e) {
        e.preventDefault();
        this.clearError(this.joinClassModal);
        const classCode = this.joinClassCodeInput.value.trim().toUpperCase();
        const submitBtn = this.joinClassForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const joinedClass = await this.api.joinClass(classCode);
            this.classes.push(joinedClass);
            this.classMap[joinedClass.classID] = joinedClass;
            this.renderStudentClassCard(joinedClass);
            this.toggleModal(this.joinClassModal, false);
            this.quizzes = await this.api.fetchMyQuizzes();
            this.renderQuizSections();
        } catch (err) {
            this.showError(this.joinClassModal, err.message || 'Failed to join class');
        } finally {
            submitBtn.disabled = false;
        }
    }

    async handleTeacherQuizSubmit(e) {
        e.preventDefault();
        this.clearError(this.teacherQuizModal);
        const topic = this.teacherQuizText.value.trim();
        const file = this.teacherFileInput.files[0];
        const numQuestions = parseInt(this.teacherNumQuestionsInput.value, 10);

        if (!topic && !file) {
            this.showError(this.teacherQuizModal, 'Please enter a course topic OR select a PDF document.');
            return;
        }
        if (numQuestions < 5 || numQuestions > 50) {
            this.showError(this.teacherQuizModal, 'Please select between 5 and 50 questions.');
            return;
        }

        const submitBtn = document.getElementById('teacher-generate-quiz');
        submitBtn.textContent = 'Generating... Please wait';
        submitBtn.disabled = true;

        try {
            const response = file
                ? await this.api.generateQuizFromPDF(file, numQuestions)
                : await this.api.generateQuizFromText(topic, numQuestions);

            this.quizzes.unshift(response.quiz);
            this.renderTeacherQuizCard(response.quiz);
            this.toggleModal(this.teacherQuizModal, false);
        } catch (err) {
            this.showError(this.teacherQuizModal, err.message || 'Error generating quiz');
        } finally {
            submitBtn.textContent = 'Generate quiz';
            submitBtn.disabled = false;
        }
    }

    showError(modalElement, message) {
        if (!modalElement) return;
        this.clearError(modalElement);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'error-msg';
        errorMessage.textContent = message;
        modalElement.querySelector('.pop-up-box').appendChild(errorMessage);
    }

    clearError(modalElement) {
        if (!modalElement) return;
        const errorEl = modalElement.querySelector('.error-msg');
        if (errorEl) errorEl.remove();
    }

    updateFileName(fileInput, displayElement) {
        displayElement.textContent = fileInput.files.length > 0
            ? `Selected: ${fileInput.files[0].name}`
            : '';
    }

    signOut() {
        localStorage.clear();
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const api = new APIService(backendURL);
    new DashboardUI(api);
});
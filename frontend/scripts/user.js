const backendURL = "http://localhost:8000"; // Assuming you are testing locally based on your screenshot

class APIService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('token');
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Handles standard text/topic quiz generation
    async generateQuizFromText(topic) {
        const response = await fetch(`${this.baseURL}/api/quiz/generate-quiz`, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic })
        });
        return this.handleResponse(response);
    }

    // Handles PDF File Upload using FormData
    async generateQuizFromPDF(file) {
        const formData = new FormData();
        formData.append('document', file); // 'document' matches the multer expected field

        const response = await fetch(`${this.baseURL}/api/quiz/generate-from-pdf`, {
            method: 'POST',
            headers: this.getHeaders(), // Let the browser set the Content-Type to multipart/form-data automatically
            body: formData
        });
        return this.handleResponse(response);
    }

    // NEW: API call to create a class
    async createClass(className) {
        // You will need to make a backend route for this (e.g., POST /api/classes)
        // For now, we mock the success response to update the UI
        console.log(`Sending ${className} to backend...`);
        return { name: className, students: [] }; 
    }

    async handleResponse(response) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "API Request Failed");
        return data;
    }

    async fetchMyQuizzes() {
        const response = await fetch(`${this.baseURL}/api/quiz/my-quizzes`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
}

class DashboardUI {
    constructor(apiService) {
        this.api = apiService;
        this.bindElements();
        this.attachEventListeners();
        this.init(); // Call init on startup
    }

    // Initialization function to fetch data on load
    async init() {
        try {
            const quizzes = await this.api.fetchMyQuizzes();
            
            // Clear out any loading text
            this.quizList.innerHTML = '';
            
            if (quizzes.length === 0) {
                this.quizList.innerHTML = '<div id="no-classes"><h4>No quizzes yet...</h4></div>';
            } else {
                quizzes.forEach(quiz => this.renderQuizCard(quiz));
            }
        } catch (err) {
            console.error("Failed to load quizzes:", err);
        }
    }

    bindElements() {
        // Modals
        this.quizModal = document.getElementById('pop-up');
        this.classModal = document.getElementById('class-pop-up');
        
        // Buttons
        this.createClassBtn = document.getElementById('create-class');
        this.createQuizBtn = document.getElementById('create-quiz');
        this.closeQuizBtn = document.getElementById('close-quiz-modal');
        this.closeClassBtn = document.getElementById('close-class-modal');
        this.signOutBtn = document.getElementById('signout');
        
        // Forms & Inputs
        this.quizForm = document.getElementById('quiz-form');
        this.quizInput = document.getElementById('quiz-text');
        this.fileInput = document.getElementById('file-input');
        this.fileNameDisplay = document.getElementById('file-name-display');
        
        this.classForm = document.getElementById('class-form');
        this.classNameInput = document.getElementById('class-name-input');
        
        // Display Lists
        this.quizList = document.getElementById('quiz-list');
        this.classList = document.getElementById('class-list');
        this.noClassesText = document.getElementById('no-classes');
    }

    attachEventListeners() {
        this.signOutBtn.addEventListener('click', () => this.signOut());
        
        // Modal Toggles
        this.createClassBtn.addEventListener('click', () => this.toggleModal(this.classModal, true));
        this.closeClassBtn.addEventListener('click', () => this.toggleModal(this.classModal, false));
        
        this.createQuizBtn.addEventListener('click', () => this.toggleModal(this.quizModal, true));
        this.closeQuizBtn.addEventListener('click', () => this.toggleModal(this.quizModal, false));
        
        // Form Submissions
        this.quizForm.addEventListener('submit', (e) => this.handleQuizSubmit(e));
        this.classForm.addEventListener('submit', (e) => this.handleClassSubmit(e));

        // Update UI when a file is selected
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files.length > 0) {
                this.fileNameDisplay.textContent = `Selected: ${this.fileInput.files[0].name}`;
            } else {
                this.fileNameDisplay.textContent = "";
            }
        });
    }

    signOut() {
        localStorage.clear();
        window.location.href = '/';
    }

    toggleModal(modalElement, show) {
        modalElement.style.display = show ? "flex" : "none";
        // Clear inputs when closing
        if (!show) {
            this.quizInput.value = "";
            this.fileInput.value = "";
            this.fileNameDisplay.textContent = "";
            this.classNameInput.value = "";
        }
    }

    async handleClassSubmit(e) {
        e.preventDefault();
        const className = this.classNameInput.value.trim();
        
        try {
            const newClass = await this.api.createClass(className);
            this.renderClassCard(newClass);
            this.toggleModal(this.classModal, false);
        } catch (err) {
            alert(err.message);
        }
    }

    renderClassCard(classData) {
        // Hide the "No classes yet..." text if it exists
        if (this.noClassesText) {
            this.noClassesText.style.display = "none";
        }
        
        const classDiv = document.createElement("div");
        classDiv.classList.add("class-box");
        
        // Clean HTML relying entirely on our updated landing.css
        classDiv.innerHTML = `
            <h4 class="class-name">${classData.name || "Unnamed Class"}</h4>
            <p class="class-size">${classData.students ? classData.students.length : 0} Students</p>
        `;
        
        // Add a click listener for the future when you want to open the class!
        classDiv.addEventListener('click', () => {
            console.log(`Clicked on class: ${classData.name}`);
            // Future feature: window.location.href = `/class-dashboard.html?id=${classData.classID}`;
        });

        this.classList.appendChild(classDiv);
    }

    async handleQuizSubmit(e) {
        e.preventDefault();
        const topic = this.quizInput.value.trim();
        const file = this.fileInput.files[0];

        // Ensure at least one input is provided
        if (!topic && !file) {
            alert("Please enter a course topic OR select a PDF document.");
            return;
        }

        const submitBtn = document.getElementById("generate-quiz");
        submitBtn.textContent = "Generating... Please wait";
        submitBtn.disabled = true;

        try {
            let response;
            
            // Mode B: PDF Upload
            if (file) {
                console.log("Uploading PDF...");
                response = await this.api.generateQuizFromPDF(file);
            } 
            // Mode A: Text/Topic Input
            else {
                console.log("Generating from topic...");
                response = await this.api.generateQuizFromText(topic);
            }
            
            console.log(`Quiz generated successfully!`);
            this.renderQuizCard(response.quiz);
            this.toggleModal(this.quizModal, false);

        } catch (err) {
            console.error(err);
            alert(err.message || "Error generating quiz");
        } finally {
            submitBtn.textContent = "Generate quiz";
            submitBtn.disabled = false;
        }
    }

    renderQuizCard(quiz) {
        const quizDiv = document.createElement("div");
        quizDiv.classList.add("class-box");
        const questionCount = quiz.questions ? quiz.questions.length : 0;
        
        quizDiv.innerHTML = `
            <h4 class="class-name">${quiz.title || "Generated Quiz"}</h4>
            <p class="class-size">${questionCount} Questions</p>
        `;
        
        // Add click event to redirect to the quiz page
        quizDiv.addEventListener('click', () => {
            // Store the specific quiz data so the next page can load it
            localStorage.setItem('currentActiveQuiz', JSON.stringify(quiz));
            window.location.href = '/take-quiz.html';
        });

        this.quizList.appendChild(quizDiv);
    }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    const api = new APIService(backendURL);
    new DashboardUI(api);
});
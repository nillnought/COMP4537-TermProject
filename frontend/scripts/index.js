class registration{

    constructor(){
        this.loginbtn = document.getElementById("log-in");
        this.registerbtn = document.getElementById("register");
        this.setup();
    }

    setup(){
        this.loginbtn.addEventListener("click", this.redirect("login"));
        this.registerbtn..addEventListener("click", this.redirect("register"));
    }

    redirect(type) {
        
    }
}
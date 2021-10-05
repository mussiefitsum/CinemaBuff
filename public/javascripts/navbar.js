function classToggle() {
    const nav = document.querySelectorAll('.nav-items')
    nav.forEach(nav => nav.classList.toggle('nav-link-toggle-show'));
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('nav-background');
}


document.querySelector('.nav-link-toggle').addEventListener('click', classToggle);


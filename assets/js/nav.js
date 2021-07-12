const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');


    burger.addEventListener('click',() => {
        //toggle nav
        nav.classList.toggle('nav-active');
    });
    //animate links
    navLinks.forEach((link,index) => {
        link.getElementsByClassName.animation=`navLinkFade 0.5s ease forwards ${index /7}s`        
    });    
}
navSlide();
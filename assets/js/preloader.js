const peck = document.querySelector('#preloader');

window.addEventListener('load', (event) => {
    
    function preloaderDelay(){
        peck.style.display="none";
    } 
    setTimeout(preloaderDelay,2000);
});


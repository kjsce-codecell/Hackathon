// Animate on Scroll
AOS.init({
  once: true,
});

$('img').attr('draggable', 'false');
var prevButton = document.querySelector('.splide-prev');
var nextButton = document.querySelector('.splide-next');

var splide = new Splide('#splide', {
  type: 'loop',
  perPage: 4,
  perMove: 4,
  focus: 'left',
  autoplay: true,
  interval: 5000,
  updateOnMove: true,
  pagination: false,
  throttle: 300,
  gap: '4%',
  start: 0,
  width: '100%',
  wheel: true,
  wheelSleep: 1000,
  releaseWheel: false,
  waitForTransition:true,
  arrows: false,
  breakpoints: {
    320: {
      perPage: 1,
      perMove: 1,
    },
    600: {
      perPage: 2,
      perMove: 2,
    },
    900: {
      perPage: 3,
      perMove: 3,
    },
  },
}).mount();

prevButton.addEventListener('click', function () {
  splide.go('<');
});

nextButton.addEventListener('click', function () {
  splide.go('>');
});

// Stats numbers

var stats = document.querySelector('#stats');
var statsLoaded = false;
var observer = new IntersectionObserver(
  function (entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      if (!statsLoaded) {
        statsLoaded = true;
        $('.stat_number').each(function () {
          $(this)
            .prop('Counter', 0)
            .animate(
              {
                Counter: $(this).text(),
              },
              {
                duration: 3000,
                easing: 'swing',
                step: function (now) {
                  $(this).text(Math.ceil(now));
                },
              }
            );
        });
      }
    });
  },
  {
    threshold: 0,
    rootMargin: '-200px 1500px -200px 1500px',
  }
);

observer.observe(stats);

// Disable parallax on mobile
if ($(window).width() < 768) {
  $('.building').removeClass('object');
}

// Konami
var egg = new Egg('h,a,c,k,6', function () {
  $('#preloader').fadeIn(1000);
  document.getElementById('preloader').innerHTML =
    ' <img src="assets/images/hack6.gif" class="preloadergif" style="max-width:100vw; max-height:100vh"/>';
  $('#preloader').css('background-color', 'black');
  $('#preloader').delay(3500).fadeOut();
}).listen();

console.log("I'm Batman.");

const linkedin = document.querySelectorAll('a.linkedin-link');
for (let i = 0; i < linkedin.length; i++) {
  linkedin[i].setAttribute('tabindex', '-1');
}
const github = document.querySelectorAll('a.github-link');
for (let i = 0; i < github.length; i++) {
  github[i].setAttribute('tabindex', '-1');
}



// GLITCH TEXT PRIZE SECTION

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let intervals = new Map();

document.querySelectorAll(".prize-box").forEach(box => {
  box.addEventListener("pointerenter", event => {
    let head = event.currentTarget.querySelector(".head");
    
    let iteration = 0;

    clearInterval(intervals.get(head));

    intervals.set(head, setInterval(() => {
      head.innerText = head.innerText
        .split("")
        .map((letter, index) => {
          if(index < iteration) return head.dataset.value[index];

          return letters[Math.floor(Math.random() * 26)]
        }).join("");

      if(iteration >= head.dataset.value.length){
        clearInterval(intervals.get(head));
      }

      iteration += 1 / 3;
    }, 30));
  });
});

// Animate on Scroll
AOS.init({
  once: true,
});

$("img").attr("draggable", "false");

// Card Swiper
var swiper = new Swiper(".mySwiper", {
  mousewheel: {
    releaseOnEdges: true,
  },
  autoHeight: true,
  slidesPerView: 1,
  spaceBetween: 30,
  slidesPerGroup: 1,
  loop: true,
  breakpoints: {
    // when window width is >= 320px
    320: {
      slidesPerView: 2,
      spaceBetween: 20,
      slidesPerGroup: 2,
    },
    // when window width is >= 480px
    600: {
      slidesPerView: 3,
      spaceBetween: 30,
      slidesPerGroup: 3,
    },
    // when window width is >= 640px
    900: {
      slidesPerView: 4,
      spaceBetween: 40,
      slidesPerGroup: 4,
    },
  },
  autoplay: {
    delay: 2500,
    disableOnInteraction: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

$(".mySwiper").hover(
  function () {
    this.swiper.autoplay.stop();
  },
  function () {
    this.swiper.autoplay.start();
  }
);
swiper.autoplay.stop();

// Stats numbers

var stats = document.querySelector("#stats");
var statsLoaded = false;
var observer = new IntersectionObserver(
  function (entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      if (!statsLoaded) {
        statsLoaded = true;
        $(".stat_number").each(function () {
          $(this)
            .prop("Counter", 0)
            .animate(
              {
                Counter: $(this).text(),
              },
              {
                duration: 3000,
                easing: "swing",
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
    rootMargin: "-200px 1500px -200px 1500px",
  }
);

observer.observe(stats);

// Disable parallax on mobile
if ($(window).width() < 768) {
  $(".building").removeClass("object");
}

// Konami 
var egg = new Egg("h,a,c,k,6", function () {
  $("#preloader").fadeIn(1000);
  document.getElementById("preloader").innerHTML =
    ' <img src="assets/images/hack6.gif" class="preloadergif" style="max-width:100vw; max-height:100vh"/>';
  $("#preloader").css("background-color", "black");
  $("#preloader").delay(3500).fadeOut();
}).listen();

console.log("I'm Batman.");
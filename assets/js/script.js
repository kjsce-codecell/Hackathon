$("img").attr("draggable", "false");
console.log("I'm Batman.")
AOS.init();

var swiper = new Swiper(".mySwiper", {
  
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
         slidesPerGroup: 2
        },
        // when window width is >= 480px
        600: {
         slidesPerView: 3,
         spaceBetween: 30,
         slidesPerGroup: 3
        },
        // when window width is >= 640px
        900: {
         slidesPerView: 4,
         spaceBetween: 40,
         slidesPerGroup: 4
        }
       },
    autoplay: {
      delay: 2500,
      disableOnInteraction: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    }
  });

$(".mySwiper").hover(function() {
    (this).swiper.autoplay.stop();
}, function() {
    (this).swiper.autoplay.start();
});
swiper.autoplay.stop();
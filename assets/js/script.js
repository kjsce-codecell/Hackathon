$("img").attr("draggable", "false");

AOS.init();

var swiper = new Swiper(".mySwiper", {

    slidesPerView: 1,
    spaceBetween: 30,
    breakpoints: {
        // when window width is >= 320px
        320: {
         slidesPerView: 1,
         spaceBetween: 20
        },
        // when window width is >= 480px
        600: {
         slidesPerView: 2,
         spaceBetween: 30
        },
        // when window width is >= 640px
        900: {
         slidesPerView: 3,
         spaceBetween: 40
        }
       },
    autoplay: {
      delay: 2500,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    }
  });



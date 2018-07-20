$('.q').hover (function(){
  $(this).children('.shape').toggleClass('hovered');
})

$('.q').on('click', function(){
  $(this).children('.shape').toggleClass('opened');
  $(this).siblings().children('.ans').toggleClass('show');
})

$(window).scroll(function() {
  var theta = $(window).scrollTop() / 100 % Math.PI;
  theta = theta/2;
  var travel = $(window).scrollTop();
  $('.backanimation__rectangle--1').css({ transform: 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)'});
  $('.backanimation__rectangle--2').css({ transform: 'translateY(-' + (travel/8) +'px)' + 'rotate(' + (theta) + 'rad)' });
  $('.backanimation__rectangle--3').css({ transform: 'rotate(' + (theta-100) + 'rad)' });
  $('.backanimation__circle--1').css({ transform: 'rotate(' + (theta+100) + 'rad)' });
  $('.backanimation__circle--2').css({ transform: 'rotate(' + (theta) + 'rad)' });
  $('.backanimation__circle--3').css({ transform: 'rotate(' + (theta-100) + 'rad)' });
  // $('#rightgear').css({ transform: 'rotate(-' + theta + 'rad)' });
  });

  // TODO
  // 1. Convert JQuery to JS
  // 2. Navbar fixed
  // 3. hamburger for mobile
  // 4. Footer, social media links
  // 5. Maps?
  // 6. Shadow Depth
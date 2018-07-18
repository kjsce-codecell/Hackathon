$('.q').hover (function(){
  $(this).children('.shape').toggleClass('hovered');
})

$('.q').on('click', function(){
  $(this).children('.shape').toggleClass('opened');
  $(this).siblings().children('.ans').toggleClass('show');
})

$(window).scroll(function() {
  var theta = $(window).scrollTop() / 100 % Math.PI;
  $('.backanimation').css({ transform: 'rotate(' + theta + 'rad)' });
  // $('#rightgear').css({ transform: 'rotate(-' + theta + 'rad)' });
  });
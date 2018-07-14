$('.q').hover (function(){
  $(this).children('.shape').toggleClass('hovered');
})

$('.q').on('click', function(){
  $(this).children('.shape').toggleClass('opened');
  $(this).siblings().children('.ans').toggleClass('show');
})
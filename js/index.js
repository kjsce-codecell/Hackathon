$('.q').hover (function(){
    $(this).children('.shape').toggleClass('hovered');
  })
  
  $('.q').on('click', function(){
    $(this).children('.shape').toggleClass('opened');
    $(this).siblings().children('.ans').toggleClass('show');
  })

var window = document.getElementsByTagName("window")[0];
var rect1 = document.getElementsByClassName("backanimation__rectangle--1")[0];
var rect2 = document.getElementsByClassName("backanimation__rectangle--2")[0];
var rect3 = document.getElementsByClassName("backanimation__rectangle--3")[0];
var rect4 = document.getElementsByClassName("backanimation__rectangle--4")[0];
var rect5 = document.getElementsByClassName("backanimation__rectangle--5")[0];

var circ1 = document.getElementsByClassName("backanimation__circle--1")[0];
var circ2 = document.getElementsByClassName("backanimation__circle--2")[0];
var circ3 = document.getElementsByClassName("backanimation__circle--3")[0];
var circ4 = document.getElementsByClassName("backanimation__circle--4")[0];
var circ5 = document.getElementsByClassName("backanimation__circle--5")[0];
var circ6 = document.getElementsByClassName("backanimation__circle--6")[0];

(window).addEventListener("scroll",function() {
  var theta = (window).scrollY / 100 % Math.PI;
  theta = theta/2;
  var travel = (window).scrollY;

  // console.log(theta);
  rect1.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  rect2.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  rect3.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  rect4.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  rect5.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';

  circ1.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ2.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ3.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ4.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ5.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ6.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  
});

//   // TODO
//   // 1. Convert JQuery to JS
//   // 2. Navbar fixed
//   // 3. hamburger for mobile
//   // 4. Footer, social media links
//   // 5. Maps?
//   // 6. Shadow Depth



///////////// FORM AJAX REQUEST
// HIDE THIS
var url = 'https://script.google.com/macros/s/AKfycby5k1hGxY8puK4xawvxMd3-_hYSrQgeA9L_7jSYq6KPxVYJd2zT/exec';

$('#submit-form').on('click', function(e) {
  e.preventDefault();  
  var form = new FormData(document.getElementById("starter-form"));
  let jsonObject = {
    name : form.get("name"),
    email : form.get("email"),
    college : form.get("college"),
  };
  $.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    data: jsonObject
  })
})
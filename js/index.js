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


var headcontent = document.getElementsByClassName("newhead__content")[0];

(window).addEventListener("scroll",function() {
  var theta = (window).scrollY / 100 % Math.PI;
  theta = theta/2;
  theta1 = theta/4;
  theta2 = theta/6;
  var travel = (window).scrollY;

  // console.log(theta);
  rect1.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  rect2.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta1+100) + 'rad)';
  rect3.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta2+100) + 'rad)';
  rect4.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  rect5.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta1+100) + 'rad)';

  circ1.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta2+100) + 'rad)';
  circ2.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ3.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta1+100) + 'rad)';
  circ4.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta2+100) + 'rad)';
  circ5.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta+100) + 'rad)';
  circ6.style.transform = 'translateY(' + (travel/10) +'px)' + 'rotate(' + (theta1+100) + 'rad)';
  headcontent.style.transform = 'translate(-50%,calc(-50% - '+(travel)+'px))';
});

//   // TODO
//   // 1. Convert JQuery to JS
//   // 2. Navbar fixed
//   // 3. hamburger for mobile
//   // 4. Footer, social media links
//   // 5. Maps?
//   // 6. Shadow Depth

var floatbutton = document.getElementsByClassName("floatbutton")[0];

$(window).scroll(function() {
  var wS = $(this).scrollTop();
  var hT = $('.schedulebox').offset().top,
  hH = $('.schedulebox').outerHeight(),
  wH = $(window).height();

	if (wS > (hT+hH-wH)){
    floatbutton.classList.add("floatbutton__show");
  }
  else{
    floatbutton.classList.remove("floatbutton__show");
  }
 });


///////////// FORM AJAX REQUEST
// HIDE THIS
var url = 'https://script.google.com/macros/s/AKfycby5k1hGxY8puK4xawvxMd3-_hYSrQgeA9L_7jSYq6KPxVYJd2zT/exec';

$('#submit-form').on('click', function(e) {
  e.preventDefault();  
  var $this = $(this);
  $.ajax({
    success:function() {
      document.getElementById("starter-form").style.visibility = "hidden";
      document.getElementById("subscribed").style.visibility = "visible";
      var subspara = document.getElementById("subscribed");
      subspara.innerHTML = "Subscribed! 🎉 ";
    }
  })
  var form = new FormData(document.getElementById("starter-form"));
  let jsonObject = {
    // name : form.get("name"),
    email : form.get("email"),
    // college : form.get("college"),
  };
  $.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    data: jsonObject,
  })
})
// SMOOTH SCROLL
$(document).ready(function(){
  // Add smooth scrolling to all links
  $("a").on('click', function(event) {

    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;

      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 800, function(){
   
        // Add hash (#) to URL when done scrolling (default click behavior)
        window.location.hash = hash;
      });
    } // End if
  });
});


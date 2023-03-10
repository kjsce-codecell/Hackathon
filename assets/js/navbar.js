const hamburger = document.querySelector(".hamburger");
const navBar = document.querySelector(".nav-links");

const navBarManager = () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    navBar.classList.toggle("active");
    if (navBar.classList.contains("active")) {
      navLinks.forEach((link, index) => {
        link.style.animation = `navLinkAnimation 0.5s ease forwards ${index / 7 + 0.3
          }s`;
      });
    } else {
      navLinks.forEach((link, index) => {
        link.style.animation = "";
      });
    }
  });
  navLinkList = [];
  navLinks.forEach((link) => navLinkList.push(link.innerText));

  // console.log(navLinkList);
  const activeMenuOnScrollHandler = () => {
    let len = sections.length - 1;
    // console.log('Current user is on ' + (window.scrollY + 70));
    while (len > -1) {
      if (window.scrollY + 125 >= sections[len].offsetTop) break;
      // console.log(navLinkList[len] + ' Section Start: ' + sections[len].offsetTop);
      len--;
    }
    // console.log(navLinkList[len]);
    document.querySelector(".active-link-name").innerText = navLinkList[len];
  };
  activeMenuOnScrollHandler();
  window.addEventListener("scroll", activeMenuOnScrollHandler);
};

navBarManager();

//smooth scroll to sections
var $root = $("html, body");

$('.nav-links * a[href^="#"]').click(function () {
  var href = $.attr(this, "href");
  hamburger.classList.toggle("open");
  navBar.classList.toggle("active");

  $root.animate({
      scrollTop: $(href).offset().top,
    },
    500,
    function () {
      window.location.hash = href;
    }
  );

  return false;
});
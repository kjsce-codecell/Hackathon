if (localStorage.getItem("codecellhack7") != null) {
  localStorage.setItem(
    "codecellhack7",
    Number(localStorage.getItem("codecellhack7")) + 1
  );
  if (localStorage.getItem("codecellhack7") % 5 === 0) {
    document.getElementById("preloader").innerHTML =
      '<div id="content"><span id="companion"></span></div>';
    document.getElementById("preloader").style.animation =
      "specialFade 1.5s ease-in-out;";
    new TypeIt("#companion", {
      speed: 40,
      waitUntilVisible: true,
    })
      .type("We invite you to hack...")
      .pause(420)
      .move(-15)
      .delete(6)
      .type("challenge")
      .move(null, { to: "END" })
      .delete(7)
      .type("debug...")
      .pause(420)
      .delete(8)
      .type("explore...")
      .go();
    $("#preloader").delay(8820).fadeOut();
  } else {
    document.getElementById("preloader").innerHTML =
      ' <img src="assets/images/Preloader.gif" class="preloadergif" style="max-width:100vw; max-height:100vh"/>';
    $("#preloader").delay(6000).fadeOut();
  }
} else {
  document.getElementById("preloader").innerHTML =
    ' <img src="assets/images/Preloader.gif" class="preloadergif" style="max-width:100vw; max-height:100vh"/>';
  localStorage.setItem("codecellhack7", 0);
  $("#preloader").delay(6000).fadeOut();
}

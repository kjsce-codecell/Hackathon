if (localStorage.getItem("codecellhack7") != null) {
  localStorage.setItem(
    "codecellhack7",
    Number(localStorage.getItem("codecellhack7")) + 1
  );
  if (localStorage.getItem("codecellhack7") % 1 === 0) {
    document.getElementById("preloader").style.display = "block";
    document.getElementById("wrapper").style.display = "none";
    document.getElementById("preloader").style.animation =
      "specialFade 1.5s ease-in-out;";
    document.body.style.overflow = "hidden";
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
      .pause(550)
      .delete(8)
      .type("explore...")
      .go();

    setTimeout(function () {
      document.getElementById("preloader").style.display = "none";
      document.getElementById("wrapper").style.display = "block";
      document.body.style.overflowY = "scroll";
    }, 8800);
  }
} else {
  localStorage.setItem("codecellhack7", 0);
}

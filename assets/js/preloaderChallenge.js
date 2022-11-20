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
      speed: 52,
      waitUntilVisible: true,
    })
      .type("We invite you to ")
      .pause(500)
      .delete(3)
      .type("all to hack")
      .pause(120)
      .move(-16)
      .delete(6)
      .type("challenge")
      .move(null, { to: "END" })
      .delete(4)
      .type("debug...")
      .pause(400)
      .delete(8)
      .type("explore...")
      .go();

    setTimeout(function () {
      document.getElementById("preloader").style.display = "none";
      document.getElementById("wrapper").style.display = "block";
      document.body.style.overflowY = "scroll";
    }, 10400);
  }
} else {
  localStorage.setItem("codecellhack7", 0);
}

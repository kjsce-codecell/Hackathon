if (localStorage.getItem("codecellhack7") != null) {
	localStorage.setItem(
		"codecellhack7",
		Number(localStorage.getItem("codecellhack7")) + 1
	);
	if (localStorage.getItem("codecellhack7") % 5 === 0) {
		document.getElementById("preloader").style.display = "block";
		document.getElementById("preloader").innerHTML =
			'<div id="content"><span id="companion"></span></div>';
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
	} else {
		document.getElementById("wrapper").style.display = "none";
		document.getElementById("preloader").style.display = "flex";
		document.getElementById("preloader").style.justifyContent = "center";
		document.getElementById("preloader").style.alignItems = "center";
		document.getElementById("preloader").style.maxWidth = "100vw";
		document.getElementById("preloader").innerHTML =
			' <img src="assets/images/Preloader.gif" class="preloadergif" style="max-width:120vw; max-height:100vh"/>';

	}
	setTimeout(function () {
		document.getElementById("preloader").style.display = "none";
		document.getElementById("wrapper").style.display = "block";
		document.body.style.overflowY = "scroll";
	}, 8820);
} else {
	localStorage.setItem("codecellhack7", 0);
}

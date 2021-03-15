$("#prev-sp").click(function(){
	$("#curr-sp").removeClass("clicked-button");
	$("#curr-sp").addClass("btn-effect");

	$("#prev-sp").addClass("clicked-button");
	$("#prev-sp").removeClass("btn-effect");

	$("#previous-sponsors").removeClass("hidden");
	$("#current-sponsors").addClass("hidden");
});

$("#curr-sp").click(function(){
	$("#prev-sp").removeClass("clicked-button");
	$("#prev-sp").addClass("btn-effect");

	$("#curr-sp").addClass("clicked-button");
	$("#curr-sp").removeClass("btn-effect");

	$("#current-sponsors").removeClass("hidden");
	$("#previous-sponsors").addClass("hidden");
});

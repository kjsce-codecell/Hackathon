$("#prev-sp").click(function(){
	$("#curr-sp").removeClass("clicked-button");
	$("#previous-sponsors").removeClass("hidden");
	$("#prev-sp").addClass("clicked-button");
	$("#current-sponsors").addClass("hidden");
});

$("#curr-sp").click(function(){
	$("#current-sponsors").removeClass("hidden");
	$("#prev-sp").removeClass("clicked-button");
	$("#curr-sp").addClass("clicked-button");
	$("#previous-sponsors").addClass("hidden");
});

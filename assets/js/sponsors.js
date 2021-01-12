// $("#prev-sp").click(function(){
// 	$("#curr-sp").removeClass("clicked-button");
// 	$("#prev-sp").addClass("clicked-button");
// 	$(".previous-sponsors").removeClass("hidden");
// 	$(".current-sponsors").addClass("hidden");
// });

// $("#curr-sp").click(function(){
// 	$("#prev-sp").removeClass("clicked-button");
// 	$("#curr-sp").addClass("clicked-button");
// 	$(".current-sponsors").removeClass("hidden");
// 	$(".previous-sponsors").addClass("hidden");
// });

$("#prev-sp").click(function(){
	$("#curr-sp").removeClass("clicked-button");
	$("#prev-sp").addClass("clicked-button");
	$("#previous-sponsors").removeClass("hidden");
	$("#current-sponsors").addClass("hidden");
});

$("#curr-sp").click(function(){
	$("#prev-sp").removeClass("clicked-button");
	$("#curr-sp").addClass("clicked-button");
	$("#current-sponsors").removeClass("hidden");
	$("#previous-sponsors").addClass("hidden");
});

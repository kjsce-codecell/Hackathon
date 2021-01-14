$(document).ready(function() {
  $('#particle-g').particleground({
    dotColor: '#0ff',
    lineColor: '#ffffff',
	minSpeedX: 0.05,
	minSpeedY: 0.05,
	maxSpeedX: 0.05,
	maxSpeedY: 0.05,
	density: 5000,
	particleRadius: 2,
	lineWidth: 0.15,
	proximity: 70,
	parallaxMultiplier: 35
  });
}); 

// To make this work
// Add class section and provide data-background-color attribute to the tags
// link the in-view.js file to the html file

/* var color = '#0ff'
inView('.section').on('enter', function(el){
  color = $(el).attr('data-background-color');
  $('#particle-g').particleground('destroy');
  $('#particle-g').particleground({
    dotColor: color,
    lineColor: '#ffffff',
	minSpeedX: 0.05,
	minSpeedY: 0.05,
	maxSpeedX: 0.05,
	maxSpeedY: 0.05,
	density: 5000,
	particleRadius: 5,
	lineWidth: 0.15,
	proximity: 70,
	parallaxMultiplier: 35
  });
}); */
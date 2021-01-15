
// To make this work
// Add class section and provide data-background-color attribute to the tags
// link the in-view.js file to the html file

var color = '#0ff'
inView('.section').on('enter', function(el){
  color = $(el).attr('data-background-color');
  $('#particle-g').particleground('option','dotColor',color)
});

$(document).ready(function() {
  $('#particle-g').particleground({
	dotColor: color,
	lineColor: '#ffffff',
	minSpeedX: 0.05,
	minSpeedY: 0.05,
	maxSpeedX: 0.05,
	maxSpeedY: 0.05,
	density: 8000,
	particleRadius: 4,
	lineWidth: 0.15,
	proximity: 70,
	parallaxMultiplier: 35
  });
});

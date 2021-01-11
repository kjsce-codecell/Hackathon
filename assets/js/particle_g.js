$(document).ready(function() {
  $('#particle-g').particleground({
    dotColor: '#0ff',
    lineColor: '#ffffff',
	minSpeedX: 0.05,
	minSpeedY: 0.05,
	maxSpeedX: 0.05,
	maxSpeedY: 0.05,
	density: 5000,
	particleRadius: 1	,
	lineWidth: 0.15,
	proximity: 70,
	parallaxMultiplier: 35
  });
});
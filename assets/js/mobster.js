;$(document).ready(function(){
  $(".owl-carousel").owlCarousel({
    items: 3,
    center: true,
    nav: true,
    dots: false,
    loop: true,
  });
});


// TOWERS

class electricity {
	constructor(selector) {
	  this.svg = document.querySelector(selector);
	  this.run();
	}
  
	render() {
	  let d = this.calculatePoints(0, 0, 500, 80);
	  this.svg.querySelectorAll('path')[0].setAttribute('d', d);
	  this.svg.querySelectorAll('path')[1].setAttribute('d', d);
	}
  
	calculatePoints(x, y, width, height) {
	  let points = [[x, height / 2]];
	  let maxPoints = 10;
	  let chunkRange = width / maxPoints;
	  for (let i = 0; i < maxPoints; i++) {
		let cx = chunkRange * i + Math.cos(i) * chunkRange;
		let cy = Math.random() * height;
		points.push([cx, cy]);
	  }
  
	  points.push([width, height / 2]);
  
	  let d = points.map(point => point.join(','));
	  return 'M' + d.join(',');
	}
  
	run() {
	  let fps = 25,
	  now,
	  delta,
	  then = Date.now(),
	  interval = 1000 / fps,
	  iteration = 0,
	  loop = () => {
		requestAnimationFrame(loop);
  
		now = Date.now();
		delta = now - then;
		if (delta > interval) {
		  then = now - delta % interval;
  
		  // update stuff
		  this.render(iteration++);
		}
	  };
	  loop();
	}}
  
  
  
  new electricity('svg');
// END TOWERS


(function ($) {
	$.fn.countTo = function (options) {
		options = options || {};
		
		return $(this).each(function () {
			// set options for current element
			var settings = $.extend({}, $.fn.countTo.defaults, {
				from:            $(this).data('from'),
				to:              $(this).data('to'),
				speed:           $(this).data('speed'),
				refreshInterval: $(this).data('refresh-interval'),
				decimals:        $(this).data('decimals')
			}, options);
			
			// how many times to update the value, and how much to increment the value on each update
			var loops = Math.ceil(settings.speed / settings.refreshInterval),
				increment = (settings.to - settings.from) / loops;
			
			// references & variables that will change with each update
			var self = this,
				$self = $(this),
				loopCount = 0,
				value = settings.from,
				data = $self.data('countTo') || {};
			
			$self.data('countTo', data);
			
			// if an existing interval can be found, clear it first
			if (data.interval) {
				clearInterval(data.interval);
			}
			data.interval = setInterval(updateTimer, settings.refreshInterval);
			
			// initialize the element with the starting value
			render(value);
			
			function updateTimer() {
				value += increment;
				loopCount++;
				
				render(value);
				
				if (typeof(settings.onUpdate) == 'function') {
					settings.onUpdate.call(self, value);
				}
				
				if (loopCount >= loops) {
					// remove the interval
					$self.removeData('countTo');
					clearInterval(data.interval);
					value = settings.to;
					
					if (typeof(settings.onComplete) == 'function') {
						settings.onComplete.call(self, value);
					}
				}
			}
			
			function render(value) {
				var formattedValue = settings.formatter.call(self, value, settings);
				$self.html(formattedValue + "+");
			}
		});
	};
	
	$.fn.countTo.defaults = {
		from: 0,               // the number the element should start at
		to: 0,                 // the number the element should end at
		speed: 1000,           // how long it should take to count between the target numbers
		refreshInterval: 100,  // how often the element should be updated
		decimals: 0,           // the number of decimal places to show
		formatter: formatter,  // handler for formatting the value before rendering
		onUpdate: null,        // callback method for every time the element is updated
		onComplete: null       // callback method for when the element finishes updating
	};
	
	function formatter(value, settings) {
		return value.toFixed(settings.decimals);
	}
}(jQuery));

jQuery(function ($) {
  // custom formatting example
  $('.count-number').data('countToOptions', {
	formatter: function (value, options) {
	  return value.toFixed(options.decimals).replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
	}
  });
  
  // start all the timers
  $('.timer').each(count);  
  
  function count(options) {
	var $this = $(this);
	options = $.extend({}, options || {}, $this.data('countToOptions') || {});
	$this.countTo(options);
  }
});

wow = new WOW();

wow.init();

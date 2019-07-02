if (detectIE()) {
    var frames = document.querySelectorAll('.js_video-box-frame');

    for (var i = frames.length; i--;) {
      frames[i].style.display = 'none';
    }
  }

  function detectIE() {
    var ua = window.navigator.userAgent;
    var msie = !!~ua.indexOf('MSIE ');
    var trident = !!~ua.indexOf('Trident/');
    var edge = !!~ua.indexOf('Edge/');

    return msie || trident || edge;
  }
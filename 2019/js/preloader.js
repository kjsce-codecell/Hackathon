$(document).ready(function() {
    //Preloader
    $(window).on("load", function() {
        preloaderFadeOutTime = 500;

        function hidePreloader() {
            var preloader = $('.preloadsvg');
            preloader.fadeOut(preloaderFadeOutTime);
        }
        hidePreloader();
    });
});

// $(window).load(function () {
//     $('.preloadsvg').fadeOut('slow');
// });
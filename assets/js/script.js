
function SponsorChange(state){
    if (state=='prev'){
        document.getElementById('previous-sponsor-button').disabled=true
        document.getElementById('current-sponsor-button').disabled=false
        document.getElementById('previous-sponsor').style.display="block"
        document.getElementById('current-sponsor').style.display="none"
    }
    else{
        document.getElementById('previous-sponsor-button').disabled=false
        document.getElementById('current-sponsor-button').disabled=true
        document.getElementById('previous-sponsor').style.display="none"
        document.getElementById('current-sponsor').style.display="block"
    }

}
$('.scroll').click(function(e) {

    e.preventDefault();
    var target = $(this).attr('href');

    if (target.length < 2) return

    // var headerOffset = 140
    var element = document.querySelector(target);

    if (element) {
        var offsetPosition = element.getBoundingClientRect().top;
    
        element.scrollIntoView({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
    
});
//aos animations
    AOS.init();
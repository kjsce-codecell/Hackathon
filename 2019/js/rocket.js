function rocketDrag(event)
{
}
$(document).ready(function(){
    sv = document.getElementsByClassName('rocketsvg')[0];
    reachus = $('#view-4');
    teamscroll = $('#info-section');
    contactshelf = $('#contact_shelf');
    innerchildparent = $('#innerchildparent');

    var isDragging = false;
    var fullc = document.getElementsByClassName('full-container')[0];
$(".overlaysvg")
.mousedown(function() {
    isDragging = true;
})
$('*').mousemove(function(e) {
    if(isDragging){
        for(var i = 0; i < fires.length; i++)
        {
            fires[i].style.display = "block";
        }
        var pagesize = window.innerHeight;
        if((e.pageY - pagesize*0.05 )>0 && (e.pageY < pagesize*0.95)){
            var percent = (e.pageY - pagesize*0.05)*100/(pagesize*0.9) ;
            sv.style.top = percent+'% ';
            //console.log(e.pageY+' '+pagesize+' hiii '+(e.pageY - pagesize*0.05)*100/(pagesize*0.9));
            sv.style.transition = 'none';
            //console.log(percent*4)
            fullc.style.scrollBehavior= 'unset';
            fullc.scrollTop=percent*0.01*(innerchildparent.height()-(reachus.height()-teamscroll.height()-contactshelf.height()));
        }

    }
 })

$('*') .mouseup(function() {
    if(isDragging){
    isDragging = false;
    fullc.style.scrollBehavior= 'smooth';
    }
});


});

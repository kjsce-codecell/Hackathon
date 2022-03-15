

function countdown(){
    var now = new Date();
    var eventDate = new Date(2022, 1, 16,19,0,0);
    var diff=eventDate-now;
    if (diff<=0){
        document.getElementById('countdown').remove();
    }
    else{
        var hours=Math.floor(diff/(60*60*1000))%24;
        var days=Math.floor(diff/(60*60*1000*24));
        var minutes=Math.floor((diff%(60*60*1000))/(60*1000));
        var seconds=Math.floor((diff%(60*1000))/1000);
        document.getElementById("hours").innerHTML=hours;
        document.getElementById("minutes").innerHTML=minutes;
        document.getElementById("seconds").innerHTML=seconds;
        document.getElementById("days").innerHTML=days;
    }
}
setInterval(countdown, 1000);
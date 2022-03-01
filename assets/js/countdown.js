

function countdown(){
    var now = new Date();
    var eventDate = new Date(2022, 2, 2,19,0,0);
    var diff=eventDate-now;
    var hours=Math.floor(diff/(60*60*1000));
    var minutes=Math.floor((diff%(60*60*1000))/(60*1000));
    var seconds=Math.floor((diff%(60*1000))/1000);
    document.getElementById("hours").innerHTML=hours;
    document.getElementById("minutes").innerHTML=minutes;
    document.getElementById("seconds").innerHTML=seconds;
}
setInterval(countdown, 1000);
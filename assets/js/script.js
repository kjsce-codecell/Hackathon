
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

//aos animations
    AOS.init();
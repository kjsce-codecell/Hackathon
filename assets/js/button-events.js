// For Previous Sponspors button in Sponspors section
const showPrevious = () => {
   console.log("hello invoked");
   document.getElementById("current-sponsor").style.display="none";
   document.getElementById("previous-sponsor").style.display="block";
}

// For Previous Sponspors button in Sponspors section
const showCurrent = () => {
   document.getElementById("current-sponsor").style.display="block";
   document.getElementById("previous-sponsor").style.display="none";
}

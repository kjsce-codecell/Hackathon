// For Previous Sponspors button in Sponspors section
const goToProjects = () => {
   window.open("https://kjscehack22.devfolio.co/projects")
}

const registerNow = () => {
   window.open("https://forms.gle/4tnJwSLvLugue9xd6");
}

// For Previous Sponspors button in Sponspors section
const showPrevious = () => {
   document.getElementById("current-sponsor").style.display="none";
   document.getElementById("previous-sponsor").style.display="block";
}

// For Previous Sponspors button in Sponspors section
const showCurrent = () => {
   document.getElementById("current-sponsor").style.display="block";
   document.getElementById("previous-sponsor").style.display="none";
}
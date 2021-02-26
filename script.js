$(document).ready(function() {
  $(".faq-container").css({
    'width': ($('.page-section .container').width() + 'px')
  });
});
for (let j = 1; j <=6 ; j++) {
    document.querySelector(`#q${j} .q`).addEventListener("click",()=>{
        document.querySelector(`#a${j}`).classList.toggle("open");
        document.querySelector(`#q${j} .fa`).style.transform = "rotate(180deg)";
        document.querySelector(`#q${j} .fa`).style.transition = "transform 0.3s";
        if (document.querySelector(`#a${j}`).classList.contains("open")) {
            document.querySelector(`#q${j} .fa`).classList.remove("fa-plus");
            document.querySelector(`#q${j} .fa`).classList.add("fa-minus");
        }else{
            document.querySelector(`#q${j} .fa`).classList.remove("fa-minus");
            document.querySelector(`#q${j} .fa`).classList.add("fa-plus");
        }
        for (let i = 1; i <= 6; i++) {
            if(i!=j){
                document.querySelector(`#a${i}`).classList.remove("open");
                document.querySelector(`#q${i} .fa`).classList.remove("fa-minus");
                document.querySelector(`#q${i} .fa`).classList.add("fa-plus");
            }
        }
    })
}
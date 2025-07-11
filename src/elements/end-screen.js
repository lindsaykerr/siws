import "../styles/route-end.css";

let endScreen = null;
function initEndScreen() {
    endScreen = document.createElement("div");
    endScreen.id = "end-screen";
    
    endScreen.innerHTML = `
        <h1 class="heading">Congrats!!!</h1>
        <img src="./trophy.svg" style="width:50vw;" alt="Trophy" class="trophy">
        <p class="text">You have successfully reached the target location</p>
        <button class="button" id="end-screen-button">Next</button>
    `;
    document.body.appendChild(endScreen);    
    endScreen.querySelector("#end-screen-button").addEventListener("click", () => {
        hideEndScreen();
        //const event = new CustomEvent("end-screen-next");
        //document.dispatchEvent(event);
    });
}
function showEndScreen() {
    if (!endScreen) {
        initEndScreen();
    }
    endScreen.style.display = "flex";
    const endButton = document.querySelector("#end-screen-button");

}
function hideEndScreen() {
    if (endScreen) {
        endScreen.style.display = "none";
    }
}

export { endScreen, initEndScreen, showEndScreen, hideEndScreen };



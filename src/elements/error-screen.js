
import "../styles/errors.css";

let errorScreen = null;
const initErrorScreen = () => {
  errorScreen = document.createElement("div");
  errorScreen.id = "error-screen";
  errorScreen.innerHTML = `
    <h1 class="heading">Error Loading Wayfinding System</h1>
    <p>Please relay any error message(s)</p>
    <ul class="messages">
    </ul>
  `;

  document.body.appendChild(errorScreen);
};

/**
 * Adds a list of messages to the error screen.
 * @param {string[]} messages 
 */
const addErrorMessages = (messages) => {
    if (!errorScreen) {
        initErrorScreen();
    }
    if (!Array.isArray(messages) && typeof messages === 'string') {
        messages = [messages];
    }

    const messageList = errorScreen.querySelector(".messages");
    messages.forEach((message) => {
        const listItem = document.createElement("li");
        listItem.textContent = message;
        messageList.appendChild(listItem);
    });

}

const showErrorScreen = () => {
    if (!errorScreen) {
        initErrorScreen();
    }
    errorScreen.style.display = "flex";
}

export {initErrorScreen, addErrorMessages,showErrorScreen};
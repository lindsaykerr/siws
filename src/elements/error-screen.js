import "../styles/errors.css";

const errorScreen = () => {
  const errorScreen = document.createElement("div");
  errorScreen.id = "error-screen";
  errorScreen.innerHTML = `
    <h1 class="heading">Error Loading Wayfinding System</h1>
    <p>Please relay any error message(s)</p>
    <ul class="messages">
    </ul>
  `;
  // set to hidden by default
  errorScreen.style.visibility = "hidden";
  errorScreen.style.display = "none"; // Hide the error screen initially
  document.body.appendChild(errorScreen);

  return errorScreen;
};

export {errorScreen};
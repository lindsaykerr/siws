import '../styles/loading.css';

/**@type {HTMLDivElement} */
let loadingScreen = null;

const initLoadingScreen = () => {
    loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    document.body.appendChild(loadingScreen);
    loadingScreen.innerHTML = `
        <h2 class="heading">Starting Wayfinding System</h2>
        <h3 class="text">Please wait while application is loading.</h3>
        <div class="spinner"></div>    
    `;
}

/**
 * changes loading screen text content.
 * @param {string} text - The text to display on the loading screen.
 */
const changeLoadingText = (text) => {
  const loadingText = document.querySelector('#loading-screen .text');
  if (loadingText) {
    loadingText.textContent = text;
  }
};

const hideLoadingScreen = () => {
  loadingScreen.style.display = 'none';
};
const showLoadingScreen = () => {
  if (!loadingScreen) {
    initLoadingScreen();
  }
  loadingScreen.style.display = 'flex';
};


export { loadingScreen, initLoadingScreen, changeLoadingText, hideLoadingScreen, showLoadingScreen };
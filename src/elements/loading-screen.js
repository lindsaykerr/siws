import '../styles/loading.css';

/**
 * Creates a loading screen element and appends it to the body.
 * @returns {HTMLElement} The loading screen element.
 */
const loadingScreen = () => {
  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'loading-screen';
  loadingScreen.innerHTML = `
    <h2>Please wait while the application is loading.</h2>
    
    <div class="spinner"></div>
      
  `;
  document.body.appendChild(loadingScreen);
  return loadingScreen;
};

export { loadingScreen };
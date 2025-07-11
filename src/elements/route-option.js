import "../styles/route-options.css";


let routeOptions = null;

const initRouteOptions = () => {
    routeOptions = document.createElement("div");
    routeOptions.id = "route-options";
    routeOptions.innerHTML = `
        <h2 class="heading">Select a Route</h2>
        <select id="route-select">
            <option value="" disabled selected>Select a route</option>
            <option value="route-a">Route A</option>
            <option value="route-b">Route B</option>
        <select>
    `;
    routeOptions.style.display = "flex";


    document.body.appendChild(routeOptions);
};

const closeRouteOptions = () => {
    if (routeOptions) {
        routeOptions.style.display = "none";
    }
};
const showRouteOptions = () => {
    if (!routeOptions) {
        initRouteOptions();
    }
    routeOptions.style.display = "flex";
};

export { initRouteOptions, closeRouteOptions, showRouteOptions};
//import * as THREE from 'three';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import {ARGraphics, NavIcon} from './graphics.js';
import * as THREE from 'three';
import loadFromGTLF from './utils/load-gltf-file.js';
import QRReader from './qr-reader.js';
import LoadWaypoints from './data/load-markers.js';
import {
    initLoadingScreen, 
    changeLoadingText, 
    hideLoadingScreen, 
    showLoadingScreen
} from './elements/loading-screen.js';
import {
    showErrorScreen, 
    addErrorMessages, 
    initErrorScreen
} from './elements/error-screen.js';
import {initRouteOptions, closeRouteOptions} from './elements/route-option.js';
import CONFIG from './config.js';


console.log(CONFIG.baseUrl);


const DEBUG_AR = false; // AR debugging flag
const debugOptions = {
    qr: true,      // QR code debugging flag
    ar: true,       // AR debugging flag
    errors: true,   // Error debugging flag
}


const MARKER_TYPES = {
    DIRECTION: "DIRECTION",
    DIRECTION_WITH_INFO: "DIRECTION_WITH_INFO",
    DESTINATION: "DESTINATION",
    DESTINATION_WITH_INFO: "DESTINATION_WITH_INFO",
    START: "START",
    START_WITH_INFO: "START_WITH_INFO",
    END: "END",
    END_WITH_INFO: "END_WITH_INFO",
    INFO: "INFO",
    WARNING: "WARNING",
}

const focusTunnel = document.querySelector("#focus");

const app = {
    mindAR: null,
    qrReader: null,
    graphics: null,
    navIcon: null,
    deviceCameras:  {
        user: null,
        environment: null,
    },
    baseUrl: CONFIG.baseUrl,
    qrTimingRef : {
        lastTime: Date.now(),
        frequency: 300, // Frequency of QR code scanning in milliseconds
    },

    ARAssets : {        // Assets used in the AR scene
        objects3D: {
            directionArrow: {name: "directionArrow", model: null, type: MARKER_TYPES.DIRECTION}, // 3D model for the direction arrow
        },
        lighting: {              
            overlaySceneLighting: [
                (() =>{
                    const ambient = new THREE.AmbientLight(0xffffff, 3); // Ambient light for the overlay scene 
                    ambient.position.set(0, 10, 0); // Position the light
                    return ambient;
                })(),
                (() =>{
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
                    directionalLight.position.set(0, 10, 10).normalize(); // Position the light
                    directionalLight.lookAt(0, 0, 0); // Make sure the light points towards the origin
                    return directionalLight;
                })(),
            ],
        }       
    },
    selectedRoute: null, // The currently selected route
    routesData: {
        "route-a": {
            "L001-Z001-M001": { id: "L001-Z001-M001", icon_type: MARKER_TYPES.DIRECTION, pointer_direction: 0, info: "Turn left at the next intersection.", coordinates: {x: 1, y: 0, z: 1} },
            "L001-Z001-M002": { id: "L001-Z001-M002", icon_type: MARKER_TYPES.DIRECTION, pointer_direction: 90, info: "Continue straight for 100 meters.", coordinates: {x: 2, y: 0, z: 2} },
            "L001-Z001-M003": { id: "L001-Z001-M003", icon_type: MARKER_TYPES.DIRECTION, pointer_direction: 180, info: "Turn right at the next intersection.", coordinates: {x: 3, y: 0, z: 3} },
        
        },
        "route-b": {}
    }
}



//////////////////////////////////////////
/// The Following begins the app loading process

new Promise((resolve, reject) => {
    
    // App begins by displaying a loading screen, which is visible by default, 
    // then app checks device compatibility
    initLoadingScreen();
    initErrorScreen();
    
    // Checks for device support
    try {
        let errorMessages = [];
        if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
            errorMessages.push("Media devices are not supported in this browser.");
            //new Error("Media devices not supported");
        }
        if (!('OffscreenCanvas' in window)) {
            errorMessages.push("OffscreenCanvas is not supported in this browser.");
        }
        if (!('ImageBitmap' in window)) {
            errorMessages.push("ImageBitmap is not supported in this browser.");
        }
        if (!window.Worker) {
            errorMessages.push("Web Workers are not supported in this browser.");
        }

        if (errorMessages.length > 0) {
            const errorList = "";
            errorMessages.forEach((msg) => {
                errorList += `<li>${msg}</li>`;
            });

            throw new Error(errorList);
        }

    } catch (error) {

        // Will output the screen what aspects of the device are not supported if any. 
        hideLoadingScreen();

        showErrorScreen();
        if (Array.isArray(error.message)) {
            addErrorMessages(error.message);
        } else {
            addErrorMessages([error.message]);
        }
        reject();
    }
    resolve();

}).then(() => {

    console.log("Device compatibility checks cleared...");
    
    changeLoadingText("Finding device cameras...");
    
    // Looking for the camera devices
    // If there is only one camera, it will be used for both user and environment.
    app.deviceCameras;

    return navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {

        const cameraInfo = document.querySelector("#cameras");
        devices.forEach(function(device) {
        //console.log('device', device);

            if (device.kind === 'videoinput') {
                const cameraData = document.createElement("span");
                cameraData.classList.add("camera-data");
                cameraData.setAttribute("data-camera_id", device.deviceId);
                cameraInfo.appendChild(cameraData);

                //console.log('device', device);
            }
        });

        
    }).then(()=>{


        const cameras = document.querySelectorAll(".camera-data");
        if(cameras.length === 0) {
            console.error("No cameras found");
            return;
        }
        else if(cameras.length === 1) {
            
            app.deviceCameras.user = cameras[0].dataset.camera_id;
            app.deviceCameras.environment = cameras[0].dataset.camera_id;
        }
        else {
            const camSwitchBtn = document.getElementById("camera-switch");
            camSwitchBtn.setAttribute("hidden", "false");
            app.deviceCameras.user = cameras[0].dataset.camera_id;
            app.deviceCameras.environment = cameras[1].dataset.camera_id;
        }
        //start();

    }).catch(function(err) {
        throw new Error(`Error accessing cameras: ${err.message}`);
    });

}).then(() => {
    
    // Next the app will load the waypoints data from the server.
    console.log("Cameras found, loading waypoints data...");
    changeLoadingText("Loading waypoints data...");
    const waypointsLoader = new LoadWaypoints(app.baseUrl); // Replace with your actual API base URL
    
    const arrayToObject = (array) => {
        const newObj = {};
        array.forEach(item => {
            if (item.id) {
                newObj[item.id] = item; // Use the id as the key
            } else {
                console.warn("Item does not have an id:", item);
            }
        });
        return newObj;
    };

    /*
    // load waypoints for route-a
    waypointsLoader.downloadWaypoints("route-a").then((waypoints) => {
        if (!waypoints) {
            throw new Error("No waypoints data found for the specified route.");
        }
        app.routesData["route-a"] = arrayToObject(waypoints);
        console.log("Waypoints data loaded successfully.");
    }).catch((error) => {
        hideLoadingScreen();
        showErrorScreen();
        addErrorMessages(`Error loading waypoints data: ${error.message}`);
        throw error;
    });

    // load waypoints for route-b
    waypointsLoader.downloadWaypoints("route-b").then((waypoints) => {
        if (!waypoints) {
            throw new Error("No waypoints data found for the specified route.");
        }
        app.routesData["route-b"] = arrayToObject(waypoints);
        console.log("Waypoints data loaded successfully.");
    }
    ).catch((error) => {
        hideLoadingScreen();
        showErrorScreen();
        addErrorMessages(`Error loading waypoints data: ${error.message}`);
        throw error;
    });
    */

}).then(() => {
    
    // After cameras are found, then the app will load the 3D assets 
    // which will be used in the AR session.

    console.log("Cameras found, initializing AR session...");
    changeLoadingText("Loading visual assets...");
    
    return loadFromGTLF('./assets/wayfinding.glb').then((assets) => {
        const Objects3D = app.ARAssets.objects3D;
       
        console.log(assets.getObjectByName(Objects3D.directionArrow.name));
        
        Objects3D.directionArrow.model = assets.getObjectByName(Objects3D.directionArrow.name);
        
       
    }).catch((error) => {

        hideLoadingScreen();
        showErrorScreen();
        addErrorMessages("Error loading visual assets. Please notify.")
        throw new Error("Error loading visual assets: " + error.message);
    });

}).then(() => {
    // After the assets are loaded, the AR system will be initialized
    console.log("Visual assets loaded, initializing AR system...");
    changeLoadingText("Initializing AR system...");

    try {
        app.mindAR = new MindARThree({
            container: document.querySelector("#container"),
            imageTargetSrc: './assets/stable_card.mind',
            filterMinCF: 0.01,
            filterBeta: 100,
            missTolerance: 1,
            warmupTolerance: .2,
            userDeviceId: app.deviceCameras.user, // Use the user camera for the AR session
            environmentDeviceId: app.deviceCameras.environment, // Use the environment camera for the QR code scanning
            uiScanning: false,
            uiLoading: true,
        })

        app.graphics = new ARGraphics(app.mindAR, document.querySelector("#container"), false);

        // Add a navigation icon to the AR scene
        app.navIcon = new NavIcon(app.graphics);

        app.navIcon.setIcon(app.ARAssets.objects3D.directionArrow.model);

        // Add lights to the overlay scene
        const overlayLighting = app.ARAssets.lighting.overlaySceneLighting;
        overlayLighting.forEach(light => {
            app.graphics.hoverScene.add(light); // Add lights to the hover scene

   
    });
    }  catch (error) {
        hideLoadingScreen();
        showErrorScreen();
        addErrorMessages("Error initializing AR system. Please notify.");
        throw new Error("Error initializing AR system: " + error.message);
    }

}).then(() => {
    
    // After the AR system is initialized, the app will load the QR code reader
    console.log("AR system initialized, loading QR code reader...");
    changeLoadingText("Loading QR code reader...");
    app.qrReader = new QRReader(document.createElement('canvas'), 'jsqr-worker.js');
   

}).then(() => {

    if (!DEBUG_AR) {
    
        // Before starting the AR session, the user must select a route, and make sure the correct camera is selected.
        console.log("QR code reader loaded, selecting route...");
        hideLoadingScreen();
        initRouteOptions();

        document.querySelector("#route-select").addEventListener("change", (event) => {
            const selectedRoute = event.target.value;
            if (selectedRoute && app.routesData[selectedRoute]) {
                app.selectedRoute = selectedRoute;
                console.log(`Selected route: ${selectedRoute}`);
                closeRouteOptions(); // Close the route selection screen
                startARSession(); // Start the AR session
            } else {
                console.error("Invalid route selected.");
                addErrorMessages("Invalid route selected. Please select a valid route.");
            }

        });
    }
    else {
        app.selectedRoute = "route-a"; // Default route for debugging
        console.log("Debugging mode enabled, starting AR session with default route: route-a");
        hideLoadingScreen(); // Hide the loading screen
        startARSession(); // Start the AR session directly
    }

}).catch((error) => {

    console.error("Error during app initialization:", error);
    hideLoadingScreen();
    showErrorScreen();
    addErrorMessages(`Cannot run app fatal error!!!`);

});


function startARSession() {

    debuggingInfo(debugOptions); 
    console.log("Starting AR session...");
    showLoadingScreen();
    changeLoadingText("Starting AR session...");

    // these should all be initialized before starting the AR session, but just in case check
    if (!(app.mindAR && app.graphics && app.qrReader)) {
        console.error("AR system, graphics, or QR reader not initialized properly.");
        showErrorScreen();
        addErrorMessages("AR system, graphics, or QR reader not initialized properly. Please notify");
        throw new Error("AR system, graphics, or QR reader not initialized properly.");
    }

    // Start the AR session
    console.log("Starting AR session...");
    const mindAR = app.mindAR;
    const ar = app.graphics;
    const qr = app.qrReader;
    const navIcon = app.navIcon;
    const routeData = app.routesData; // Get the route data from the app object 
    

    
    ar.start();

    ar.viewAR = false; // Enable AR view
    ar.viewOverlay = false; // Enable overlay view
    let ARsession = false; // Flag to indicate that the AR session is active
    let intervalId = null; // Variable to hold the interval ID
    let started = false; // Flag to indicate that the AR session has started
    let paused = false; // Flag to indicate that the AR session is paused
    window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            ar.stop(); // Stop the AR session when the page is hidden
            paused = true; // Set the paused flag to true
        } else {
            if (paused) {
                ar.start(); // Restart the AR session when the page is visible again
                paused = false; // Reset the paused flag
            }
        }
    });
            

    ar.renderer.setAnimationLoop(() => {
        if (paused) return; // If the session is paused, do not render anything

        if (qr.isReady && mindAR.video.readyState === mindAR.video.HAVE_ENOUGH_DATA) {
            if (!started) {
                started = true; // Set the flag to true after the first frame
                hideLoadingScreen(); // Hide the loading screen after the first frame
            }
            qr.scanning(mindAR.video, app.qrTimingRef);    
            if (DEBUG_AR && debugOptions.qr) {
                    updateQrDebugInfo(); // Update the QR debug info
            }
            if(qr.isDetected) {
            
                if(qr.isNew()) {
                    const code = qr.activeCode; // Get the current active QR code
                    if(routeData[app.selectedRoute][code]) {
                        
                        const marker = routeData[app.selectedRoute][code];
                        //console.log("Marker found:", navIcon);
                        switch (marker.icon_type) {
                            case MARKER_TYPES.DIRECTION:
                                navIcon.setIcon(app.ARAssets.objects3D.directionArrow.model);
                                navIcon.offsetRotation(marker.pointer_direction);
                                
                                break;
                            case MARKER_TYPES.END: 
                                showEndScreen();
                                mindAR.stop(); // Stop the AR session
                                return; // Stop the AR session when the end marker is reached       
                                break;
                            default:
                                console.warn(`Unknown marker type: ${marker.icon_type}`);
                                break;
                        }
              
                    }
                }
                if (intervalId) {
                    clearInterval(intervalId); // Clear the interval when QR code is detected
                    intervalId = null; // Reset the interval ID
                }
            }            
            
            // if qr or code is not detected, set a delay before removing the navigation icon
            if (!ar.active || (ar.active && !qr.isDetected)) {
                if (!intervalId) {
                    intervalId = setTimeout(() => {
                        ARsession = false; 
                        //navIcon.resetOrientation(); // Reset the navigation icon orientation
                    }, 100); 
                }
            }
            else {
                ARsession = true; // Set AR session to true when QR code is detected
            }
        }
        if (ARsession) {
            focusTunnel.style.display = 'none'; // Show the focus tunnel when QR code is detected
            ar.viewOverlay = true; // Show overlay when QR code is detected
            ar.viewAR = true; // Enable AR view
        }
        else {
            focusTunnel.style.display = 'block'; // Hide the focus tunnel when no QR code is detected
            ar.viewOverlay = false; // Hide overlay when no QR code is detected
            ar.viewAR = false; // Disable AR view
        }
        
        ar.render();
    });
}
 

  
/*

await loadFromGTLF('./assets/wayfinding.glb')
.then((assets) => {
    console.log("Attempting to load assets.");

    console.log(assets)

    const mindAR = app.mindAR;
    const objects3D = app.ARAssets.objects3D;
    const overlayLighting = app.ARAssets.lighting.overlaySceneLighting;
    const qr = app.qrReader;


    objects3D.directionArrow.model = assets.getObjectByName(objects3D.directionArrow.name);
    if (!objects3D.directionArrow.model) {
        throw new Error("3D model not found in the GLTF file.");
    }
    
    // setup the AR graphics
    const ar = new ARGraphics(mindAR, document.querySelector("#container"), true);

    // Add a navigation icon to the AR scene
    const navIcon = new NavIcon(ar);
    navIcon.setIcon(objects3D.directionArrow.model);

    // Add lights to the overlay scene
    overlayLighting.forEach(light => {
        ar.hoverScene.add(light); // Add lights to the hover scene
    });

    // run the AR session
    ar.start();

    ar.viewAR = false; // Enable AR view
    ar.viewOverlay = false; // Enable overlay view
    let ARsession = false; // Flag to indicate that the AR session is active
    let intervalId = null; // Variable to hold the interval ID
    ar.renderer.setAnimationLoop(() => {
        if (qr.isReady && mindAR.video.readyState === mindAR.video.HAVE_ENOUGH_DATA) {
            qr.scanning(mindAR.video, app.qrTimingRef);    
            if (DEBUG_AR && debugOptions.qr) {
                    updateQrDebugInfo(); // Update the QR debug info
            }
            if(qr.isDetected) {
            
                if(qr.isNew()) {
                    const code = qr.activeCode; // Get the current active QR code
                    for (const route of routeData) {
                        if (route.id === code) {
             
                            // Update the navigation icon with the new route data
                            //navIcon.setIconType(route.icon_type);
                            navIcon.offsetRotation(route.pointer_direction);
                            //navIcon.setInfo(route.info);
                            //navIcon.setCoordinates(route.coordinates);
                        }
                    }
                }
                if (intervalId) {
                    clearInterval(intervalId); // Clear the interval when QR code is detected
                    intervalId = null; // Reset the interval ID
                }
            }            
            
            // if qr or code is not detected, set a delay before removing the navigation icon
            if (!ar.active || !qr.isDetected) {
                if (!intervalId) {
                    intervalId = setTimeout(() => {
                        ARsession = false; 
                        //navIcon.resetOrientation(); // Reset the navigation icon orientation
                    }, 100); 
                }
            }
            else {
                ARsession = true; // Set AR session to true when QR code is detected
            }
        }
        if (ARsession) {
            ar.viewOverlay = true; // Show overlay when QR code is detected
            ar.viewAR = true; // Enable AR view
        }
        else {
            ar.viewOverlay = false; // Hide overlay when no QR code is detected
            ar.viewAR = false; // Disable AR view
        }
        
        ar.render();
    });
})
.catch((error) => {
    console.error("Errors after loading GTLF file", error);
    if (DEBUG_AR) {
        const list = DEBUG_INFO_ELEM.querySelector("ul");
        if (!list) {
            const ul = document.createElement("ul");
            DEBUG_INFO_ELEM.appendChild(ul);
        }
        const li = document.createElement("li");
        li.textContent = `${error.message}`;
        DEBUG_INFO_ELEM.querySelector("ul").appendChild(li);
    }
});


camSwitchBtn.addEventListener("click", () => {
    app.mindAR.switchCamera();
});
*/

function debuggingInfo (debugOptions) {
    if (DEBUG_AR) {
        const DEBUG_INFO_ELEM = document.getElementById("debug-info");
    
    // remove the hidden attribute to show the debug info element
        if (DEBUG_INFO_ELEM.hasAttribute("hidden")) {
            DEBUG_INFO_ELEM.removeAttribute("hidden");
        }
        if (debugOptions.qr) {
            console.log("QR code debugging is enabled.");
            const qrDiv = document.createElement("div");
            qrDiv.id = "qr-debug-info";
            qrDiv.innerHTML = `<h2>QR Code Debugging Info</h2>
            <ul>
                <li>QR Code Detected: <span id="qr-detected">false</span></li>
                <li>Last QR Code: <span id="last-qr-code">N/A</span></li>
                <li>Current QR Code: <span id="current-qr-code">N/A</span></li>
            </ul>`;
            DEBUG_INFO_ELEM.appendChild(qrDiv);
        }
        if (debugOptions.errors) {
            console.log("Error debugging is enabled.");
            const errorDiv = document.createElement("div");
            errorDiv.id = "error-debug-info";
            errorDiv.innerHTML = `<h2>Error Debugging Info</h2>
            <ul id="error-list">
                <li>No errors reported yet.</li>
            </ul>`;
            DEBUG_INFO_ELEM.appendChild(errorDiv);
        }
    }
}

function updateQrDebugInfo() {
    const qrDetectedElem = document.getElementById("qr-detected");
    const lastQrCodeElem = document.getElementById("last-qr-code");
    const currentQrCodeElem = document.getElementById("current-qr-code");

    if (app.qrReader.isReady) {
        qrDetectedElem.textContent = app.qrReader.codeDetected ? "true" : "false";
        lastQrCodeElem.textContent = app.qrReader.lastCode || "N/A";
        currentQrCodeElem.textContent = app.qrReader.currentCode || "N/A";
    }

}



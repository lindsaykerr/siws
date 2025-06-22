//import * as THREE from 'three';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import {ARGraphics, NavIcon} from './graphics.js';

import * as THREE from 'three';
import loadFromGTLF from './utils/load-gltf-file.js';
import QRReader from './qr-reader.js';
import LoadWaypoints from './data/load-markers.js';
import {loadingScreen} from './elements/loading-screen.js';
import {errorScreen} from './elements/error-screen.js';

const DEBUG_AR = true; // AR debugging flag
const debugOptions = {
    qr: true,      // QR code debugging flag
    ar: true,       // AR debugging flag
    errors: true,   // Error debugging flag
}
debuggingInfo(debugOptions); 


new Promise((resolve, reject) => {
    // Start with a loading screen and check for device compatibility

    const loadScrn = loadingScreen();
    const errorScrn = errorScreen();
    
    // Check for device support
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

        // output to screen why the app is not supported 
        loadScrn.remove();
        errorScrn.style.visibility = "visible"; 
        errorScrn.style.display = "block"; 
      
        errorScrn.querySelector("#error-screen .messages").innerHTML = error.message;
        reject(error);
    }

    resolve(loadScrn);
}).then((loadScrn) => {
    // If the device is compatible, start to load application components
    console.log("Device is compatible. Loading application components...");

    console.log(loadScrn);

});










// Looking for the camera devices, create a span for each camera and store the deviceId in the data-camera_id attribute
// If there is only one camera, it will be used for both user and environment.
const deviceCameras = {
    user: null,
    environment: null
};

await navigator.mediaDevices.enumerateDevices()
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
        
        deviceCameras.user = cameras[0].dataset.camera_id;
        deviceCameras.environment = cameras[0].dataset.camera_id;
    }
    else {
        const camSwitchBtn = document.getElementById("camera-switch");
        camSwitchBtn.setAttribute("hidden", "false");
        deviceCameras.user = cameras[0].dataset.camera_id;
        deviceCameras.environment = cameras[1].dataset.camera_id;
    }
    //start();

}).catch(function(err) {
    console.log(err.name + ": " + err.message);
});

const ICON_TYPES = {
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



const app = {
    mindAR: new MindARThree({
        container: document.querySelector("#container"),
        imageTargetSrc: './assets/stable_card.mind',
        filterMinCF: 0.01,
        filterBeta: 100,
        missTolerance: 1,
        warmupTolerance: .2,
        userDeviceId: deviceCameras.user, // Use the user camera for the AR session
        environmentDeviceId: deviceCameras.environment, // Use the environment camera for the QR code scanning
        uiScanning: false,
    }),
    qrReader: new QRReader(document.createElement('canvas'), 'jsqr-worker.js'),

    qrTimingRef : {
        lastTime: Date.now(),
        frequency: 300, // Frequency of QR code scanning in milliseconds
    },

    ARAssets : {        // Assets used in the AR scene
        objects3D: {
            directionArrow: {name: "directionArrow", model: null, type: ICON_TYPES.DIRECTION}, // 3D model for the direction arrow
        },
        lighting: {              
            overlaySceneLighting: [
                (() =>{
                    const ambient = new THREE.AmbientLight(0xffffff, 1.5); // Ambient light for the overlay scene 
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
    routesData: {
        "route-a": [
            {id: "L001-Z001-M001", pointer_direction: 45, icon_type: ICON_TYPES.DIRECTION, info: "Next marker 20m", coordinates: {x: 0, y: 0}},
            {id: "L001-Z001-M002", pointer_direction: 90, icon_type: ICON_TYPES.DIRECTION, info: "Next marker 30m", coordinates: {x: 10, y: 0}},
            {id: "L001-Z001-M003", pointer_direction: 135, icon_type: ICON_TYPES.DIRECTION, info: "Next marker 40m", coordinates: {x: 20, y: 0}},   
        ]
        ,
        "route-b": {
            id: undefined,
            pointer_direction: undefined,
            icon_type: ICON_TYPES.DIRECTION,
            info: undefined,
            coordinates : {x:0, y:0},
        },
    }
}


    


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



//import * as THREE from 'three';
import {MindARThree} from 'mind-ar/dist/mindar-image-three.prod.js';
import ARWayfindingGraphics from './graphics.js';


//
import QRReader from './qr-reader.js';
const app = {
    qrTimingRef : {
        lastTime: Date.now(),
        frequency: 200, // Frequency of QR code scanning in milliseconds
    },
    cameras: {
        user: null,
        environment: null
    }
}

const DEBUG_AR = true; // AR debugging flag
let DEBUG_INFO_ELEM;
if (DEBUG_AR) {
    DEBUG_INFO_ELEM = document.getElementById("debug-info");
    DEBUG_INFO_ELEM.setAttribute("hidden", "false");
}
/////////////
// DOM SETUP
/////////////

// this will be used as offscreen canvas needed by the jsqr worker 
const canvasOffscreen = document.createElement('canvas');

const camSwitchBtn = document.getElementById("camera-switch");
const cameras = document.querySelector("#cameras");


await navigator.mediaDevices.enumerateDevices()
.then(function(devices) {
    devices.forEach(function(device) {
    //console.log('device', device);

    if (device.kind === 'videoinput') {
        const cameraData = document.createElement("span");
        cameraData.classList.add("camera-data");
        cameraData.setAttribute("data-camera_id", device.deviceId);
        cameras.appendChild(cameraData);

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
        
        app.cameras.user = cameras[0].dataset.camera_id;
        app.cameras.environment = cameras[0].dataset.camera_id;
    }
    else {
        camSwitchBtn.setAttribute("hidden", "false");
        app.cameras.user = cameras[0].dataset.camera_id;
        app.cameras.environment = cameras[1].dataset.camera_id;
    }
    //start();

}).catch(function(err) {
    console.log(err.name + ": " + err.message);
});




const qrReader      = new QRReader(canvasOffscreen, 'jsqr-worker.js');
const mindARThree   = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: './assets/stable_card.mind',
    filterMinCF: 0.01,
    filterBeta: 100,
    missTolerance: 1,
    warmupTolerance: .2,
    userDeviceId: app.cameras.user,
    environmentDeviceId: app.cameras.environment,
    uiScanning: false,
})


const ar = new ARWayfindingGraphics(mindARThree, document.querySelector("#container"), true);
await ar.start();  // start the AR Wayfinding system


const renderer = ar.renderer;
renderer.setAnimationLoop(() => {



        /*
        qrReader.checkForQr(mindarThree.video, timingRef);

        //renderer.clear(); // Clear the renderer to avoid drawing the previous frame

        if (qrReader.isDetected) {
    
            if (anchor && anchor.group.visible) {
                scene.visible = true;
          
                const worldPosition = new THREE.Vector3();
                
                const worldScale = new THREE.Vector3();

                anchor.group.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
                
                
                //only rotates on the Y axis
                pointerGroup?.rotation.setFromQuaternion(new THREE.Quaternion(0, worldQuaternion.y, 0, worldQuaternion.w));


                if (timmingOut) {
                    clearTimeout(timmingOut);
                    timmingOut = null;
                }
                overlayScene.visible = true;

                // will write the derived AR World position, quaternion and scale to the debug info element 
                if (DEBUG_AR) {
                    const debug_info = `
                        AR World:
                        position:\tx-${worldPosition.x.toFixed(2)}, y-${worldPosition.y.toFixed(2)}, z-${worldPosition.z.toFixed(2)}<br>
                        quaternion:\tx-${worldQuaternion.x.toFixed(2)}, y-${worldQuaternion.y.toFixed(2)}, z-${worldQuaternion.z.toFixed(2)}, w-${worldQuaternion.w.toFixed(2)}<br>
                        scale: x-${worldScale.x.toFixed(2)}, y-${worldScale.y.toFixed(2)}, z-${worldScale.z.toFixed(2)}
                    `;    
                    DEBUG_INFO_ELEM.innerHTML = debug_info;
                }   
            }
            else {
   

                if (!timmingOut) {
                    timmingOut = setTimeout(() => {
                        worldQuaternion.set(0, 0, 0, 1);
                        if (DEBUG_AR) {
                            DEBUG_INFO_ELEM.innerHTML = "No anchor visible";
                        }
                        timmingOut = null;
                        scene.visible = false;
                        overlayScene.visible = false;
                    }, 500);
                } 
                
    
                
            }
        }
        else {
            
        */
        ar.renderAll();
    

});


camSwitchBtn.addEventListener("click", () => {
    mindarThree.switchCamera();
});


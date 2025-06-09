import './style.css';
import CameraToCanvas from "./lib/camera-to-canvas";

const video = document.createElement('video');

const processedCanvas = document.getElementById('canvas');



video.autoplay = true;
video.playsInline = true;

video.id = 'cameraFeed';

//document.body.appendChild(video);
processedCanvas.style.display = 'hidden'; // Hide the canvas element


(() => {
    if (!window.Worker) {
        console.error("Web Workers are not supported in this browser.");
        return;
    }

    if (!window.OffscreenCanvas) {
        console.error("OffscreenCanvas is not supported in this browser.");
        return;
    }

    // Initialize the CameraToCanvas instance


let readCode = null; // Holds the previous image data for comparison
          
const cameraToCanvas = new CameraToCanvas(video, processedCanvas, '../canvas-worker.js', { video: true, audio: false });
cameraToCanvas.start();

function tick(timestamp) {
        if (!cameraToCanvas.ready) {
            return;
        }
        if (cameraToCanvas.hasQR()) {
            readCode = cameraToCanvas.getQR();
            console.log("QR Code detected:", readCode);
        }
      
        

        requestAnimationFrame(tick);
        


       
    }
    
requestAnimationFrame(tick);


})();



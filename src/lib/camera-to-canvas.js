/**
 * 
 * @fileoverview Contains the functionality to handle video streaming from a camera to a canvas element.
 * @author Lindsay Kerr
 * @version 0.0.1
 * 
 */

/**
 * @class CameraToCanvas
 * @description A class to handle video streaming from a camera to a canvas element.
 * It pairs with a Web Worker to process video frames offscreen for performance. Therefor the webworker must use an api described in camera-to-canvas.md
 * 
 * ```text
 * ON MESSAGE events:
 * // to initialize the worker with an OffscreenCanvas instance
 * {
 *   type: 'init',
 *   canvas: offscreenCanvas,
 * }
 * // to process a frame
 * {
 *   type: 'frame',
 *   bitmap: imageBitmap, // An ImageBitmap to be processed
 * }
 * 
 * //// POST MESSAGE events:
 * // when the worker is ready to process frames
 * {    
 *   type: 'ready',
 * }
 * ```
 */

class CameraToCanvas {
    /**
     * Constructs a CameraToCanvas instance.
     * @param {HTMLVideoElement} videoElement - The video element to stream the camera feed into.
     * @param {HTMLCanvasElement} canvasElement - The canvas element to draw the processed frames onto.
     * @param {string} canvasWorker - Path to the worker script for processing canvas frames, defaults to './canvas-worker.js' 
     * @param {MediaStreamConstraints} cameraSourceOptions - Options for the camera source, defaults to { video: true, audio: false }.
     */

    #cameraSourceOptions;
    #processing;
    #canvasWorker;
    #offscreenCanvas;


    constructor(videoElement, canvasElement, canvasWorker = './canvas-worker.js', cameraSourceOptions = { video: true, audio: false }) {
        this.ready = false;
        try {
            this.#canvasWorker = new Worker(new URL(canvasWorker, import.meta.url), { type: 'module' });
        }
        catch (error) {
            console.error("Error creating worker:", error);
            throw new Error("Failed to create worker in CameraToCanvas. Please check the worker script path.");
            return;
        }
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        //this.ctx = canvasElement.getContext('2d');
        this.#cameraSourceOptions = cameraSourceOptions;
        this.#processing = true;
        this.offscreenCanvas = this.canvasElement.transferControlToOffscreen();
        this.qrCode = null;
    
        
    }

    start() {
        this.#initWorker();   
        this.#stateEventListeners();
        this.#startVideoStream();
        this.#listenForMessages();
        this.ready = true;
    }

    hasQR() {
        return this.qrCode !== null;
    }
    getQR() {
        if (this.qrCode) {
            let temp = this.qrCode;
            this.qrCode = null; // Reset qrData after retrieval
            return temp;
        }
    }

    #listenForMessages() {
        this.#canvasWorker.onmessage = (event) => {
         
            switch (event.data.type) {
                case 'ready':
                    console.log("Canvas worker is ready.");
                    break;
                case 'resized':
                    console.log("Canvas worker resized.");
                    break;
                case 'qr detected':
                    //console.log("Received sample image from canvas worker.");
                    this.qrCode = event.data.code;
                     
                                       //console.log("Received image sample from canvas worker.");
                    break;
                    
                default:
                    console.log(event);
                    console.warn("Unknown message type from canvas worker:", event.type);
            }
        };
    }



    


    #initWorker() {
        this.#canvasWorker.postMessage({
            type: 'init',
            canvas: this.offscreenCanvas,
            width: this.canvasElement.width,
            height: this.canvasElement.height
        }, [this.offscreenCanvas]);
    }

    #stateEventListeners() {
        this.videoElement.addEventListener('pause', () => {
            this.#processing = false; 
        }
        );
        this.videoElement.addEventListener('ended', () => {
            this.#processing = false; // Stop processing when ended
        });
        this.videoElement.addEventListener("play", () => {
            this.videoElement.requestVideoFrameCallback(this.#processVideoFrame.bind(this));
        });

        window.addEventListener('resize', () => {
            const width = this.canvasElement.clientWidth;
            const height = this.canvasElement.clientHeight;

            this.#canvasWorker.postMessage({
                type: 'resize',
                width: width,
                height: height
            });
        });
    }

    #startVideoStream() {
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use 'environment' for rear camera
                width: { ideal: 1280 }, // Set ideal width
                height: { ideal: 720 } // Set ideal height
            },
            audio: false
        }).then((stream) => {
            const {width, height} = stream.getVideoTracks()[0].getSettings();
            console.log(`${width}x${height}`)
            this.videoElement.srcObject = stream;
            
            this.videoElement.onloadedmetadata = () => {
                const width = this.canvasElement.clientWidth;
                const height = this.canvasElement.clientHeight;
    
                this.#canvasWorker.postMessage({
                    type: 'resize',
                    width: width,
                    height: height
                });

                this.videoElement.play();
            };
            
        }).catch((error) => {
            console.error("Error accessing webcam:", error);
            alert("Could not access webcam. Please check permissions.");
        });
    }
    
    #processVideoFrame(now, metadata) {
        
        if (!this.#processing) return;
        
        createImageBitmap(this.videoElement).then((bitmap) => {
            //console.log("Processing video frame:", bitmap);
            this.#canvasWorker.postMessage({
                type: 'frame',
                bitmap: bitmap,
            }, [bitmap]);
            // Request the next frame
            this.videoElement.requestVideoFrameCallback(this.#processVideoFrame.bind(this));
        }).catch((error) => {
            console.error("Error processing video frame:", error);
            // try to request the next frame even if there's an error
            this.videoElement.requestVideoFrameCallback(this.#processVideoFrame.bind(this));
        });
    }

}

export default CameraToCanvas;
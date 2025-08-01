import JsqrWorker from './jsqr-worker.js?worker';
/**
 * All third party libraries use copyright of the respective authors.
 */
/**
 * QRReader class for reading QR codes from an image/video source. 
 * This class pairs with a web worker. Default worker is 'jsqr-worker.js'.
 */
export default class QRReader {
    #readerReady = false;

    /**
     * Creates an instance of QRReader. 
     * @param {HTMLCanvasElement} canvasForOffscreen 
     * @param {string} workerPath 
     */
    constructor( canvasForOffscreen) {

        try {
            this.worker = new JsqrWorker();
        } catch (error) {
            console.error("Failed to create worker:", error);
            throw error;
        }

        this.tempCanvas = document.createElement("canvas");
        this.tempCanvas.id = "tempCanvas";
        this.tempCanvas.style.visibility = "hidden";
        document.body.appendChild(this.tempCanvas);
        
        this.offscreen = canvasForOffscreen.transferControlToOffscreen();
        
        this.#initializeWorker();

        this.lastCode = undefined;
        this.currentCode = undefined;
        this.pixelLocation = null;
        this.codeDetected = false;
        
        this.#incomingMessageHandler();
    }

    /**
     * Private method initializes the worker by sending the offscreen canvas to it.
     * This method is be called after the worker is created.
     */
    #initializeWorker() {
        this.worker.postMessage({ 
            type: "init",
            canvas: this.offscreen,
        },[this.offscreen]);
    }

    /**
     * Private method to that state incoming message API from the worker.
     * This method listens for messages from the worker and processes them accordingly.
     * It updates the reader's state based on the messages received.
     */
    #incomingMessageHandler() {
        this.worker.onmessage = (event) => {
            switch(event.data.type) {
                case "worker ready":
                    this.#readerReady = true;
                    console.log("jsqr worker is ready");
                    break;
                case "code":
                    const { code, location } = event.data;

                    this.codeDetected = true;
                    //console.log("QR Code detected:", code);
                    if (this.prevCode === code) {
                        this.lastCode = code;
                        this.currentCode = code;
        
                    }
                    else {
                        this.lastCode = this.currentCode;
                        this.currentCode = code;
                        this.pixelLocation = location;
                    }

                    break;
                case "no code":
                    this.codeDetected = false;
                    //console.log("No QR Code detected");
                    break;  

                case "recieve getbitmap":

                    
                default:
                    console.warn("Unknown message type from jsqrWorker:", event.data.type);
                break;   
            }
        }
    }
    /**
     * @typedef {Object} QRTimingRef
     * @property {number} lastTimeCheck - last timestamp when the source was checked for a QR code.
     * @property {number} qrScanFrequency - the frequency in milliseconds at which the source should be checked for a QR code.
     */
    /**
     * This method is meant to be used within an animation loop or a periodic check to see if a 
     * QR code is present in the source.
     * @param {HTMLVideoElement|HTMLCanvasElement} source 
     * @param {QRTimingRef} qrTimingRef - an object containing the lastTimeCheck and qrScanFrequency properties.
     * @returns {number} - the updated lastTimeCheck timestamp.
     */


    get isReady() {
        return this.#readerReady;
    }
    /**
     * // checkForQr method checks if the source (video or canvas) has a QR code.
     * @param {HTMLVideoElement|HTMLCanvasElement} source 
     * @param {{lastTime: number, frequency:number}} qrTimingRef - timing reference, contains contains last timestamp value and frequency properties. 
     */

    showTempCanvas() {
        
        if (this.tempCanvas.style.visibility === "hidden") {
            this.tempCanvas.style.visibility = "visible";
        }
    }

    scanning(source, qrTimingRef) {

        if (source && Date.now() - qrTimingRef.lastTime > qrTimingRef.frequency) {
            this.#readImageSource(source);
            qrTimingRef.lastTime = Date.now();
        }    
    }

    /**
     * Private method that reads the image source and sends it to the worker for QR code detection.
     * This method can handle both video and canvas elements as sources.
     * @param {HTMLVideoElement|HTMLCanvasElement} source - canvas or video element 
     * @returns 
     */
    #readImageSource(source) {
        if (!this.#readerReady && !source) {
            console.warn("QRReader is not ready yet.");
            return;
        }

        /*
        const width = source.width || source.videoWidth || parseInt((source.style.width).replace("px", ""),10);
        const height = source.height || source.videoHeight ||parseInt((source.style.height).replace("px", ""),10); 

        const offscreen = new OffscreenCanvas(width, height);
        const ctx = offscreen.getContext("2d");
        if (!ctx) {
            console.error("Failed to get 2D context from OffscreenCanvas.");
            return;
        }
     

        ctx.drawImage(source, 0, 0, width, height);

        const imageBitmap = offscreen.transferToImageBitmap();
        */
        createImageBitmap(source).then((imageBitmap) => {
        this.worker.postMessage({
            type: "frame",
            bitmap: imageBitmap,
            width: source.videoWidth || source.width,
            height: source.videoHeight || source.height
        },[imageBitmap]);
        }).catch((error) => {
            console.error("Error creating ImageBitmap from source:", error);
        });
           
    }

    /**
     * Returns the last detected QR code.
     * @returns {string|undefined} The last detected QR code or undefined if no code was detected.
     */
    get prevCode() {
        if (this.lastCode) {
            return this.lastCode;
        }
        return;
    }

    /**
     * Returns the current active QR code.
     * @returns {string|undefined} The current active QR code or undefined if no code was detected.
     */
    get activeCode() {
        if (this.codeDetected && this.currentCode) {
            return this.currentCode;
        }
        return;
    }

    /**
     * Returns a boolean indicating whether a QR code has been detected.
     * @returns {boolean} true if a QR code has been detected, false otherwise.
     */
    get isDetected() {
        return this.codeDetected;
    }

    /**
     * A function that uses the four corners of the QR code to calculate the pixel width of the QR code.
     * @returns {number|undefined} The pixel width of the QR code.
     */
    pixelWidth () {
        if (this.codeDetected && this.pixelLocation) {
            const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = qrcode.pixelLocation;
            const width = Math.sqrt(
                Math.pow(topRightCorner.x - topLeftCorner.x, 2) + Math.pow(topRightCorner.y - topLeftCorner.y, 2)
            );
            return width;
        }
        else {
            return;
        }
    }

    isNew() {
        if (!this.codeDetected) {
            return;
        }
    
        return this.currentCode !== this.lastCode;
    
    }

    /**
     * @typedef {Object} ScreenLimits
     * @property {number} width - The width of the screen.
     * @property {number} height - The height of the screen.
     */
    /**
     * Checks if the QR code is within an acceptable range of the screen size
     * @param {ScreenLimits} limits - The limits for the QR code size 
     * @returns {boolean} true if the QR code is larger than 60% of the screen width, false otherwise
     * 
     */
    acceptableRange(limits) {
        const width = this.pixelWidth();

        if (width && width > limits.width * 0.6) {
            return true;
        }
        return false;
    }
}




import jsQR from "jsqr";


/** @type {OffscreenCanvas} */
let offscreenCanvas = null;


/** @type {OffscreenCanvasRenderingContext2D} */
let ctx = null;

onmessage = async function (event) {

    switch (event.data.type) {
        case "init":
            offscreenCanvas = event.data.canvas;
            ctx = offscreenCanvas.getContext("2d");

            // Initialization logic can be added here if needed
            postMessage({ 
                type: "worker ready"
            
            });
            break;
        case "frame":

            const height = event.data.height;
            const width = event.data.width;
            /** @type {Promise<ImageBitmap} */
            const bitmap = event.data.bitmap;

            //console.log("worker frame received", width, height, bitmap);
            // Resize the offscreen canvas if dimensions have changed
            if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {    
                offscreenCanvas.width = width;
                offscreenCanvas.height = height;
            }
            /*
            const imagePromise = await bitmap.catch((error) => {
                console.error("Error creating ImageBitmap:", error);
                throw error;
            });*/

            //ctx.clearRect(0, 0, width, height);

            //openImageBitmap(bitmap)
            ctx.drawImage(bitmap, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);

            //console.log("Image data retrieved from canvas", imageData.length);

            const code = jsQR(imageData.data, width, height);
            //console.log("QR code detection result:", code);

            if (code) {
                postMessage({
                    type: "code",
                    code: code.data,
                    location: code.location
                });
            } else {
                postMessage({ type: "no code" });
            }
            break;

        
        default:
            console.warn("Unknown message type:", event.data.type);
            break;
    }
}

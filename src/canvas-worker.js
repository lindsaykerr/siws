import { updateCameraToCanvas } from "./lib/update-orientation";


let offscreenCanvas; // holds the OffscreenCanvas instance
let ctx;





let imageData = null; // Holds the image data for QR processing
let lastTime = Date.now(); // Timestamp for the last QR code check


const qrWorker = new Worker(new URL('./qr-worker.js', import.meta.url), { type: 'module' });

qrWorker.onmessage = (event) => {
    switch (event.data.type) {
        case 'qrw ready':
            console.log('QR Worker is ready.');
            QRWorker_running = true;
            break;
        case 'qr detected':
            console.log('QR Code detected:', event.data.code);
            self.postMessage({type: 'qr detected', code: event.data.code});
            break;
        default:
            console.error('Unknown message from QR Worker:', event.data);
            break;
    }
};
      


const onMessageOperations = {
    "init": function (event) {
        //console.log('Initializing OffscreenCanvas worker...');
        offscreenCanvas = event.data.canvas;
        ctx = offscreenCanvas.getContext('2d');
        self.postMessage({type: 'ready'});

    },

    "resize": function (event) {
        if (!offscreenCanvas) {
            console.error('OffscreenCanvas is not initialized.');
            return;
        }
        //console.log('Resizing OffscreenCanvas to:', event.data.width, 'x', event.data.height);
        offscreenCanvas.width = event.data.width;
        offscreenCanvas.height = event.data.height;
        ctx = offscreenCanvas.getContext('2d');
        self.postMessage({type: 'resized'});
    },

    "frame": function (event) {
        const imageBitmap = event.data.bitmap;

            
        if (!ctx) {
            console.error('Canvas context is not initialized.');
            return;
        }

 

        updateCameraToCanvas(imageBitmap, offscreenCanvas, ctx);  
        imageBitmap.close();  
        if ((Date.now() - lastTime > 300)) {


           
            const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);            
            
            
            qrWorker.postMessage({
                    type: 'sample image',
                    width: offscreenCanvas.width,
                    height: offscreenCanvas.height,

                    imageData: imageData.data.buffer // Send the image data to the QR worker
                },
                [imageData.data.buffer] // Transfer the bitmap to the worker
                );
        

            lastTime = Date.now();
        }

       
        
        

      




    },
    "add operation": ((event) => {
        if (!event.data || !event.data.operation) {
            console.error('No operation specified in the message.');
            return;
        }
        // now checks to see if operation has been defined within onMessageOperations
        if (onMessageOperations.hasOwnProperty(event.data.operation.typeName)) {
            console.error(`Operation already defined for type: ${event.data.operation.typeName}`);
            self.postMessage({type: 'error', message: `Operation already defined for type: ${event.data.operation.typeName}`});
            return;
        }
        else {
            onMessageOperations[event.data.operation.typeName] = event.data.operation.exec;
            console.log(`Operation added for type: ${event.data.operation.typeName}`);
        }
    })
};

self.onmessage = (event)=> {
   // console.log('Worker received message of type:', event.data.type);
  
    if(!onMessageOperations.hasOwnProperty(event.data.type)) {
            console.error(`No operation defined for message type: ${event.data.type}`);
            self.postMessage({type: 'error', message: `No operation defined for message type: ${event.data.type}`});
    }
    else {
        onMessageOperations[event.data.type](event);
    }

}


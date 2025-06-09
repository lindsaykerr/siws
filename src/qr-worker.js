
import jsQR from "jsqr";

self.onmessage = (event) => {

    if (event.data.type === "init qrw") {
        self.postMessage({ type: "qrw ready" });
    }

    if (event.data.type === "sample image") {

        const buffer = event.data.imageData;
        const imagedata = new ImageData(
            new Uint8ClampedArray(buffer),
            event.data.width,
            event.data.height
        );

        
        //console.log(imagedata.data)
        
        const qrCode = jsQR(imagedata.data, imagedata.width, imagedata.height);
        if (qrCode) {
            //console.log("QR Code detected:", qrCode.data);
            self.postMessage({ type: "qr detected", code: qrCode.data });
        } 
    }
}

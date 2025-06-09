
function updateCameraToCanvas(imageBitmap, canvas, ctx) {
    const cameraOrientation = (imageBitmap.width > imageBitmap.height) ? 'landscape' : 'portrait';
    const displayOrientation = (canvas.width > canvas.height) ? 'landscape' : 'portrait';
    

    let drawStrategy;

    if (displayOrientation.match(cameraOrientation)) {
      drawStrategy = standardScalingStrategy;
      //console.log('Using standard scaling strategy');
    } else {

        drawStrategy = rotateVideoRightStrategy;
      
    }

    drawStrategy(imageBitmap, canvas, ctx);
  }

  function standardScalingStrategy(imageBitmap, canvas, ctx) {
    const x1 = imageBitmap.width;
    const y1 = imageBitmap.height;
    const x2 = canvas.width;
    const y2 = canvas.height;

    let canvasRatio = x2 / y2;
    let bitmapRatio = x1 / y1;

    if (canvasRatio === bitmapRatio) {
      
      ctx.drawImage(imageBitmap, 0, 0, x1, y1, 0, 0, x2, y2);
    } else if (canvasRatio > bitmapRatio) {
      // Canvas is wider than imageBitmap, center video vertically
      const scaledHeight = y1 * (x2 / x1);
      const offsetY = (y2 - scaledHeight) / 2;
      ctx.drawImage(imageBitmap, 0, 0, x1, y1, 0, offsetY, x2, scaledHeight);
    } else {
      // Canvas is taller than video, center video horizontally
      const scaledWidth = x1 * (y2 / y1);
      const offsetX = (x2 - scaledWidth) / 2; 
      ctx.drawImage(imageBitmap, 0, 0, x1, y1, offsetX, 0, scaledWidth, y2);
    }
  }

  /**
   * Strategy for rotating the video feed to fit the canvas when the display orientation
   * does not match the camera orientation. This method handles right rotation only.
   */
  
function rotateVideoRightStrategy(imageBitmap, canvas, ctx) {
    const x1 = imageBitmap.width;
    const y1 = imageBitmap.height;
    const x2 = canvas.height;
    const y2 = canvas.width;

    let canvasRatio = x2 / y2;
    let videoRatio = x1 / y1;

    if (canvasRatio === videoRatio) {
      ctx.translate(y2, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(video, 0, 0, x1, y1, 0, 0, x2, y2);
      ctx.resetTransform();
    } else if (canvasRatio > videoRatio) {
      // Canvas is wider than video, center video vertically
      const scaledHeight = y1 * (x2 / x1);
      const offsetY = (y2 - scaledHeight) / 2;

      ctx.save();
      ctx.translate(y2, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(imageBitmap, 0, 0, x1, y1, 0, offsetY, x2, scaledHeight);
      ctx.restore();
    } else {
      // Canvas is taller than video, center video horizontally
      const scaledWidth = x1 * (y2 / y1);
      const offsetX = (x2 - scaledWidth) / 2; 

      ctx.translate(y2, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(imageBitmap, 0, 0, x1, y1,
        offsetX, 0, scaledWidth, y2);
      ctx.resetTransform();
    }
  }

  /**
   * Strategy for rotating the video feed to fit the canvas when the display orientation
   * does not match the camera orientation. This method handles left rotation only.
   */
function rotateVideoLeftStrategy(imageBitmap, canvas, ctx) {
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
      0, 0, imageBitmap.height * (canvas.height/ imageBitmap.height ), imageBitmap.width * (canvas.height / imageBitmap.width));
    ctx.restore();
}

export {updateCameraToCanvas}


# Camera to Canvas Module Info

## Web Worker API for Camera to Canvas
This document describes the API for a web worker that processes frames from a camera and draws them onto an OffscreenCanvas.

### ON MESSAGE events:

to initialize the worker with an OffscreenCanvas instance
```js
{
    type: 'init',
    canvas: offscreenCanvas, // An OffscreenCanvas element to draw on
}
```

to process a video frame
```js
  {
    type: 'frame',
    bitmap: imageBitmap, // An ImageBitmap to be processed
  }
```

to add additional types of operations to the worker 
```js
{
  type: 'add operation',
  operation: {
    typeName: 'rotate 90%', // or other operation types
    exec: (ctx) => {
       // Custom operation logic using the provided CanvasRenderingContext2D
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.rotate(Math.PI / 2); // Rotate 90 degrees
      const bitmap = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.putImageData(bitmap, -ctx.canvas.width / 2, -ctx.canvas.height / 2);
      ctx.restore();
    },
  }
}
```

additional drawing operations. Note that these added after the frame is processed. 
```js
{
  type: 'draw',
  draw: (ctx) => {
    // Custom drawing operations using the provided CanvasRenderingContext2D
    return [
        ctx.fillStyle = 'red',
        ctx.fillRect(10, 10, 100, 100),
    ];
    
  },
}
```
  
### POST MESSAGE events:
when the worker is ready to process frames
```js
{    
  type: 'ready',
}
```
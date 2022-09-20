import tracking from 'jstracking';
import sharp from 'sharp';

/* ----- This file should probably go in schedule personalizer? or can you make this a web module so it actually works? ---- */
async function makeUint8ClampedArray(): Promise<Uint8ClampedArray> {
    const { data, info } = await sharp('src/map.svg')
    // output the raw pixels
        .raw()
        .toBuffer({ resolveWithObject: true });

    // create a more type safe way to work with the raw pixel data
    // this will not copy the data, instead it will change `data`s underlying ArrayBuffer
    // so `data` and `pixelArray` point to the same memory location
    const pixelArray = new Uint8ClampedArray(data.buffer);
    // console.log(pixelArray);
    return pixelArray;
}

function makeNodes(): void {
    //const img = []
    const tracker = new tracking.ColorTracker(['magenta', 'cyan', 'yellow']);

    tracker.on('track', function(event) {
        event.data.forEach(function(rect) {
            console.log(rect.x, rect.y, rect.width, rect.height, rect.color);
        });
    });

    tracking.track(makeUint8ClampedArray(), tracker);
}

export { makeNodes, makeUint8ClampedArray };
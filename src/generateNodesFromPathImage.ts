//import { Rect } from 'blob-detection-ts';
import MSER from 'blob-detection-ts';
import * as is from 'image-sync';

export function nodeJSImageToImageData(imageData?: Uint8ClampedArray): ImageData {
    // Dont use cause it doesnt work im pretty sure
    const img = new ImageData(imageData || new Uint8ClampedArray(10), 10, 10);
    return img;
}

export function generateNodes(imageData: ImageData, nodeColorWeights?: [string, number][]): { r: unknown[], i: ImageData } {
    const mser = new MSER({
        delta: 0.05,
        minArea: 0.0001,
        maxArea: 0.0005,
        maxVariation: 200,
        minDiversity: 0.5
    });
    
    const imgD = is.read('./test/graystylemap.png');
    var rects = mser.extract(imgD || imageData).map(region => {
        return region.rect;
    });

    rects = mser.mergeRects(rects);
    
    rects.map(function(rect){
        var rgba = [42,240,69,255];
        mser.drawRectOutline(rect, rgba, imgD || imageData)
    });

    imgD.saveAs('./out.png');

    // Temporary
    return { r: rects, i: imgD || imageData };
}

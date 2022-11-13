// TODO: learn how to use js classes again
// export function createHTMLElement()

// svg can be a layer, or anything really
export function createLayer(
    svg: HTMLElement | SVGSVGElement,
    name?: string,
    append?: boolean,
    attr?: string
): SVGGElement {
    const existingLayers = Array.from(svg.children).filter((child) =>
        child.id.includes('new-layer')
    );
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', name || 'new-layer-' + existingLayers.length);
    // g.setAttribute()
    if (append) svg.appendChild(g);
    return g;
}

export function clearG(svg: SVGGElement | HTMLElement) {
    svg.innerHTML = '';
}

export function createText(
    svg: HTMLElement | SVGGElement,
    x: number,
    y: number,
    text: string,
    color?: string,
    size?: number,
    font?: string,
    opacity?: number,
    id?: string
) {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x.toString());
    textEl.setAttribute('y', y.toString());
    textEl.setAttribute('fill', color || 'black');
    textEl.setAttribute('font-size', size ? size.toString() : '12');
    textEl.setAttribute('font-family', font || 'Arial');
    textEl.setAttribute('opacity', opacity ? opacity.toString() : '1');
    textEl.setAttribute('id', id || 'made-up-id');
    textEl.innerHTML = text;
    svg.appendChild(textEl);
}

export function createRect(
    svg: HTMLElement | SVGGElement,
    x: number,
    y: number,
    width: number,
    height: number,
    stroke: string,
    fill?: string,
    strokeWidth?: number,
    opacity?: number
) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x.toString());
    rect.setAttribute('y', y.toString());
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', fill || 'none');
    rect.setAttribute('stroke', stroke || 'black');
    rect.setAttribute('stroke-width', strokeWidth ? strokeWidth.toString() : '1');
    rect.setAttribute('opacity', opacity ? opacity.toString() : '1');
    svg.appendChild(rect);
}

export function createCircle(
    svg: HTMLElement | SVGGElement,
    x: number,
    y: number,
    color?: string,
    radius?: number,
    opacity?: number,
    id?: string
) {
    const existingCircles = Array.from(svg.children).filter((child) => child.tagName === 'circle');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x.toString());
    circle.setAttribute('cy', y.toString());
    circle.setAttribute('r', radius ? radius.toString() : (2.5).toString());
    circle.setAttribute('fill-opacity', opacity ? opacity.toString() : '1');
    circle.setAttribute('fill', color || 'red');
    circle.setAttribute('id', 'circle-' + (id || existingCircles.length));
    svg.appendChild(circle);
}

export function createLine(
    svg: HTMLElement | SVGGElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width?: number,
    color?: string,
    opacity?: number,
    id?: string
) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', color || 'red');
    line.setAttribute('stroke-width', width ? width.toString() : '1');
    line.setAttribute('stroke-opacity', opacity ? opacity.toString() : '1');
    line.setAttribute('id', id || 'line-' + Math.random());

    svg.appendChild(line);
}

export function createPath(
    svg: HTMLElement | SVGGElement,
    path: string,
    color?: string,
    width?: number,
    opacity?: number
) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);
    pathEl.setAttribute('stroke', color || 'red');
    pathEl.setAttribute('stroke-width', width ? width.toString() : '1');
    //pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke-opacity', opacity ? opacity.toString() : '1');
    pathEl.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(pathEl);
}

export function deleteDraw(svg: SVGGElement, id: string) {
    const el = document.getElementById(id);
    if (el) svg.removeChild(el);
}

export class SvgDraw {
    el;
    constructor(layerElemnet: HTMLElement) {
        this.el = layerElemnet;
    }
}

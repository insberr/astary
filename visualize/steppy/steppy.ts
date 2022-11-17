import {
    HookData,
    HookDataType,
    randomNodes,
    randomWalls,
    Raycast,
    Line,
    Point,
    RayE,
    generateNodes,
    svgToPaths,
    NewWall,
    NewNode,
} from '../../src/astar';
// @ts-ignore
import JsonViewer from 'json-viewer-js';
import { clearG, createCircle, createLayer, createLine, createPath } from '../../src/svgEdit';

// @ts-ignore
import _dt from 'bundle-text:../maptest/BHS_Building_Map_SVG.svg';
import { defaultFilterFunction, generateWalls } from '../../src/generateNodesFromSVG';

function createElement(str: string): Element | null {
    const temp = document.createElement('template');
    str = str.trim();
    temp.innerHTML = str;
    return temp.content.firstElementChild;
}

const s = 30;
let drawMap = false;
let drawWalls = true;
let drawText = true;
let pathStart = 0;
let pathEnd = s;

const map_svg = createElement(_dt) as SVGSVGElement;
if (map_svg === null) {
    throw new Error('map_svg is null');
}

map_svg.id = 'drawing-svg';
map_svg.setAttribute('width', '100%');
map_svg.setAttribute('height', '');

const drawSvg = document.getElementById('drawing-svg');
let drawingLayer = document.getElementById('drawing-layer') as unknown as SVGGElement;
if (drawSvg === null) {
    throw new Error('drawSvg is null');
}
if (drawingLayer === null) {
    new Error('drawingLayer is null, Attempting to create layer');
    drawingLayer = createLayer(drawSvg, 'drawing-layer');
}
drawingLayer = drawingLayer as SVGGElement;

const params = new URLSearchParams(window.location.search);
const resetStorage = params.get('reset') === 'true';

// console.clear = () => {};

function getNodesFromStorage(): NewNode[] {
    const nodes = localStorage.getItem('nodes');
    if (nodes === null) {
        const newNodes = randomNodes({
            amount: s,
            width: 512,
            height: 512,
            distance: 5,
            alignment: 20,
            connections: 1,
        });
        localStorage.setItem('nodes', JSON.stringify(newNodes));
        return newNodes;
    }
    return JSON.parse(nodes).map((e: Node) => {
        return { ...e, edges: new Set<number>() };
    });
}

function getWallsFromStorage(): NewWall[] {
    const walls = localStorage.getItem('walls');
    if (walls === null) {
        const newWalls = randomWalls({
            amount: Math.floor(s / 5),
            width: 512,
            height: 512,
            distance: 10,
        });
        localStorage.setItem('nodes', JSON.stringify(newWalls));
        return newWalls;
    }
    return JSON.parse(walls);
}

let nodes: NewNode[] = !resetStorage
    ? getNodesFromStorage()
    : randomNodes({ amount: s, width: 512, height: 512, distance: 5, padding: 20, alignment: 1 });
let walls: NewWall[] = !resetStorage
    ? getWallsFromStorage()
    : randomWalls({ amount: Math.floor(s / 5), width: 512, height: 512, distance: 10 });

if (nodes.length != s) {
    localStorage.removeItem('nodes');
    location.reload();
} else {
    localStorage.setItem('nodes', JSON.stringify(nodes));
}

const nw = Math.max.apply(
    null,
    nodes.map((x) => x.x)
);
const nh = Math.max.apply(
    null,
    nodes.map((y) => y.y)
);

if (walls.length != s / 5) {
    localStorage.removeItem('walls');
    location.reload();
} else {
    localStorage.setItem('walls', JSON.stringify(walls));
}

function drawMapFn() {
    const drawing_div = document.getElementById('drawing-div');
    if (drawing_div === null) {
        throw new Error('drawing_div is null');
    }

    drawing_div.replaceChild(map_svg, document.getElementById('drawing-svg') as Element);
    // document.getElementById('pathfinding').style.display = 'inline'; // Show the pathfinding drawings
    const svgPaths = svgToPaths(_dt, defaultFilterFunction);
    nodes = generateNodes(svgPaths);
    walls = generateWalls(svgPaths);
    reRaycast();
    drawingLayer = createLayer(map_svg, 'drawing-layer', true);
}
function undrawMapFn() {
    const newSvg = createElement(
        '<svg width="512" height="512" viewBox="0 0 512 512" version="1.1" id="drawing-svg" xml:space="preserve" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><g id="drawing-layer"></g></svg>'
    ) as SVGSVGElement;
    const drawing_div = document.getElementById('drawing-div');
    if (drawing_div === null) {
        throw new Error('drawing_div is null');
    }
    drawing_div.replaceChild(newSvg, document.getElementById('drawing-svg') as HTMLElement);
    nodes = getNodesFromStorage();
    walls = getWallsFromStorage();
    reRaycast();
    drawingLayer = document.getElementById('drawing-layer') as unknown as SVGGElement;
}

const wh: number[] = [];
const ww: number[] = [];
walls.forEach((element) => {
    ww.push(element.s.x, element.e.x);
    wh.push(element.s.y, element.e.y);
});
const w = Math.max.apply(null, [...ww, nw]);
const h = Math.max.apply(null, [...wh, nh]);

// drawSvg.setAttribute("width", nw'px');
// drawSvg.setAttribute("height", nh+'px');

let steps: HookData[] = [];
let currentStep = 0;
let autoplay = false;
let autoplayTimer: NodeJS.Timeout;

(document.getElementById('displ') as HTMLInputElement).addEventListener('change', () => {
    autoplay = (document.getElementById('displ') as HTMLInputElement).checked;
    if (autoplay) {
        autoplayTimer = setInterval(() => {
            currentStep++;
            clamp();
        }, 500);
    } else {
        clearInterval(autoplayTimer);
    }
});

const drawMapBtn = document.getElementById('draw-map-btn');
if (drawMapBtn) {
    drawMapBtn.innerText = drawMap ? 'Undraw Map' : 'Draw Map';

    drawMapBtn.addEventListener('click', () => {
        console.clear();
        drawMap = !drawMap;
        drawMapBtn.innerText = drawMap ? 'Undraw Map' : 'Draw Map';
        if (drawMap) {
            drawMapFn();
        } else {
            undrawMapFn();
        }
        clamp();
    });
}

function clamp() {
    currentStep = Math.max(Math.min(currentStep, steps.length - 1), 0);
    upd();
}
function upd() {
    const f = document.getElementById('num') as HTMLInputElement;
    f.value = currentStep.toString().padStart((steps.length - 1).toString().length, '0');
    draw();
}
document.getElementById('next')?.addEventListener('click', () => {
    currentStep += 1;
    clamp();
});
document.getElementById('prev')?.addEventListener('click', () => {
    currentStep -= 1;
    clamp();
});
document.getElementById('num')?.addEventListener('blur', () => {
    const e = document.getElementById('num') as HTMLInputElement;
    currentStep = parseInt(e.value);
    if (isNaN(currentStep)) {
        currentStep = 0;
    }
    clamp();
});
document.getElementById('first')?.addEventListener('click', () => {
    currentStep = 0;
    clamp();
});
document.getElementById('last')?.addEventListener('click', () => {
    currentStep = steps.length - 1;
    clamp();
});

let casted = Raycast(nodes, walls, {
    hook: (d, n, w) => {
        steps.push(d);
    },
});

function reRaycast() {
    steps = [];
    currentStep = 0;
    casted = Raycast(nodes, walls, {
        hook: (d, n, w) => {
            steps.push(d);
        },
    });
}

const dt = document.getElementById('info');
if (dt) {
    dt.innerText =
        s +
        ' nodes; ' +
        casted.nodes.length +
        ' after cast; ' +
        steps.length +
        ' steps (0-' +
        (steps.length - 1) +
        ');';
}

function drawLine(l: NewWall, style: string, strokeWidth: number = 1) {
    // ctx.beginPath();
    const ss = l.s;
    const se = l.e;
    // ctx.strokeStyle = style;
    // ctx.lineWidth = strokeWidth;
    // ctx.moveTo(scaledS.x, scaledS.y);
    // ctx.lineTo(scaledE.x, scaledE.y);
    // ctx.stroke();

    createPath(drawingLayer, `M${ss.x} ${ss.y} L${se.x} ${se.y}`, style, strokeWidth);
}

function drawDot(p: Point, radius: number, style: string, id: string | number) {
    // ctx.beginPath();
    // ctx.strokeStyle = style;
    // ctx.fillStyle = style;
    // ctx.arc((p.x / w) * 512, (p.y / h) * 512, radius, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.stroke();
    createCircle(drawingLayer, p.x, p.y, style, radius, 1, id + '');
}

function drawStep(st: HookData) {
    switch (st.type) {
        case HookDataType.RayConstructed:
            // console.clear();
            // ! drawLine(st.ray.l, 'lightblue');
            drawDot(nodes[st.ray.ref], 3, 'lightblue', st.ray.ref);
            break;
        case HookDataType.RayHits:
            console.log(st.hits);
            // ! drawLine(st.ray.l, 'blue');
            drawDot(nodes[st.ray.ref], 3, 'blue', st.ray.ref);
            st.hits.forEach((h) => {
                if (h.ref == st.ray.ref) {
                    return;
                }
                switch (h.t) {
                    case 'node':
                        drawDot(h.c, 3, 'blue', h.ref);
                        break;
                    case 'wall':
                        // ! drawLine(h.ref, 'blue');
                        break;
                    case 'ray':
                        // ! drawLine(h.l, 'blue');
                        break;
                }
            });
            break;
        case HookDataType.HitNode:
            drawDot(nodes[st.hit.ref as number], 3, 'green', st.ray.ref + 'ray');
            // ! drawLine(st.ray.l, 'green');
            break;
        case HookDataType.HitWall:
            // ! drawLine(st.hit.ref as Line, 'green');
            // ! drawLine(st.ray.l, 'green');
            break;
        case HookDataType.Finished:
            // ctx.clearRect(0, 0, canvas.width, canvas.height);
            clearG(drawingLayer);
            casted.nodes.forEach((c, iii) => {
                drawDot(c, 3, c.createdByRaycast ? 'orange' : 'green', iii);
                c.edges.indexes.forEach((ed) => {
                    // ! drawLine({ sx: c.x, sy: c.y, ex: nodes[ed].x, ey: nodes[ed].y }, 'green');
                });
            });
            walls.forEach((w) => {
                drawLine(w, 'yellow');
            });
            break;
        case HookDataType.HitRay:
            // ! drawLine((st.hit as RayE).l, 'green');
            // ! drawLine(st.ray.l, 'green');
            break;
        case HookDataType.HitRayNewNode:
            // ! drawLine((st.hit as RayE).l, 'green');
            // ! drawLine(st.ray.l, 'green');
            drawDot(st.newNode, 3, 'green', nodes.indexOf(st.newNode));
            break;
    }
}

function draw() {
    const cstep = steps[currentStep];
    // (document.getElementById('cstep') as HTMLPreElement).innerText = JSON.stringify(cstep, null, 2);
    (document.getElementById('cstep') as HTMLDivElement).innerHTML = '';
    (document.getElementById('cstep') as HTMLDivElement).innerHTML = '';
    new JsonViewer({
        container: document.getElementById('cstep'),
        data: JSON.stringify(cstep, (k, v) => {
            if (k === 'type') {
                return '[HookDataType ' + v + '] ' + HookDataType[v];
            }

            if (k === 'edges') {
                return [...v];
            }
            return v;
        }),
        theme: 'dark',
        expand: false,
    });

    (document.getElementById('cstepInfo') as HTMLDivElement).innerText =
        cstep.info + ' (' + HookDataType[cstep.type] + ')';
    // ctx.setTransform(1, 0, 0, 1, 0, 0);
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearG(drawingLayer);
    cstep.entries.forEach((t) => {
        switch (t.t) {
            case 'node':
                drawDot(t.c, 2, nodes[t.ref].createdByRaycast ? 'orange' : 'red', t.ref);
                break;
            case 'wall':
                // ! drawLine(t.ref, 'yellow');
                break;
            case 'ray':
                // ! drawLine(t.l, 'purple');
                break;
        }
    });

    drawStep(steps[currentStep]);
    /*ctx.beginPath()
    ctx.strokeStyle = "white"
    ctx.arc(128,128,20,0,2*Math.PI)
    ctx.stroke()*/
}

clamp();
/*const ele = document.createElement("pre")
ele.innerText = JSON.stringify(steps, null, 2)
document.body.appendChild(ele)*/

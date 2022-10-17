import {
    randomNodes2,
    AStar,
    Raycast,
    randomWalls2,
    Node,
    Line,
    Entry,
    Point,
    RayE,
    HookData,
} from '../src/astar';

import { clearG, createCircle, createLayer, createLine, createPath, createRect } from './svgEdit';

const params = new URLSearchParams(window.location.search);
function intParam(name: string, defaul: number): number{
    const o = params.get(name);
    if (o == null) {
        return defaul;
    } else {
        return parseInt(o);
    }
}

const amt = intParam('amt', 50);
const count = intParam('count', 500);
const w = intParam('w', 1000);
const h = intParam('h', 1000);

const conAmt = 1;
const ele = document.getElementById('mes');
const timeNodes: number[] = [];
const rayTimes: number[] = [];
let failedRuns = 0;
const timePathfind: number[] = [];
const average = (array: number[]) => array.reduce((a, b) => a + (b || 0), 0) / array.length;
const extraNodes: number[] = [];
const pathLengths: number[] = [];
function createMes() {
    let msg = '';
    msg += `Nodes: ${amt} \n`;
    msg += `Func randomNodes2: ${average(timeNodes).toFixed(5)}ms \n`;
    msg += `Func randomWalls2: ${average(timeNodes).toFixed(5)}ms \n`;
    msg += 'Raycast: ' + average(rayTimes).toFixed(5) + 'ms; \n';
    msg += 'Pathfind: ' + average(timePathfind).toFixed(5) + 'ms; \n';
    msg += 'Raycast Created Nodes: ' + average(extraNodes).toFixed(5) + '; \n';
    msg += 'Average Path Length: ' + average(pathLengths).toFixed(5) + '; \n';
    msg += `Runs: ${average([timeNodes.length, timePathfind.length])}/${count} & ${failedRuns} Failed \n`;
    return msg;
}

// SVG Drawing Setup
let svg = document.getElementById('drawing-svg');
if (svg === null) {
    throw new Error('SVG does not exist');
}

let draw = document.getElementById('drawing-layer') as unknown as SVGGElement || createLayer(svg, 'drawing-layer');
if (draw === null) {
    throw new Error('drawing layer does not exist');
}

svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
svg.setAttribute('width', '50%');
svg.setAttribute('height', '50%');



const dt = document.getElementById('data');
let datas: any[] = [];

async function doOP() {
    const t1 = performance.now();
    const _nodes = randomNodes2(amt, w, h, {
        distance: 10,
        padding: 20,
        alignment: 10,
    });
    // console.log(_nodes.filter(n => n.x >= w || n.y >= h));
    const t2 = performance.now();

    const walls = randomWalls2(20, w, h, 5, 100);
    const t6 = performance.now();

    const raycastNodes = _nodes;//await Raycast(_nodes, walls);

    const t7 = performance.now();
    clearG(draw);
    createRect(draw, 0, 0, w, h, 'black', 'none', 6);

    walls.forEach((wall) => {
        createPath(draw, `M${wall.sx} ${wall.sy} L${wall.ex} ${wall.ey}`, 'black', 2);
    });

    raycastNodes.forEach((node, i) => {
        const [nx, ny] = [node.x, node.y];
        let fillColor = node.raycast ? 'white' : 'lime';

        createCircle(draw, nx, ny, fillColor, 5);
    });

    raycastNodes.forEach((node) => {
        node.edges.forEach((edge) => {
            createPath(draw, `M${node.x} ${node.y} L${raycastNodes[edge].x} ${raycastNodes[edge].y} Z`, 'red');
        });
    });

    const t3 = performance.now();

    try {
        const pathStart = 0;
        const pathEnd = 2;
        const path = await AStar(0, 2, raycastNodes);
        const t4 = performance.now();

        timePathfind.push(t4 - t3);
        timeNodes.push(t2 - t1);
        pathLengths.push(path.length);
        rayTimes.push(t7 - t6);
        extraNodes.push(raycastNodes.length - amt);

        const f = raycastNodes[pathStart];
        const end = raycastNodes[pathEnd];

        createCircle(draw, f.x, f.y, 'lightblue', 5);
        createCircle(draw, end.x, end.y, 'lightblue', 5);

        path.forEach((i, ii) => {
            if (raycastNodes[path[ii + 1]]) {
                const dPath = `M${raycastNodes[i].x} ${raycastNodes[i].y} L${raycastNodes[path[ii + 1]].x} ${
                    raycastNodes[path[ii + 1]].y
                } Z`;
                createPath(draw, dPath, 'lightblue', 2, 0.8);
            }

            createCircle(draw, raycastNodes[i].x, raycastNodes[i].y, 'lightblue', 2.5, 0.8);
        });
    } catch (e) {
        console.log(e);
    }

    if (ele != undefined) {
        ele.innerText = createMes();
    }
}

function settings() {
    const s = document.getElementById('settings');
    if (!s) {
        return;
    }
    s.innerHTML = 'Settings: <br />';
    s.innerHTML += 'Slow: ' + speed + ';<br />';
    s.innerHTML += 'Width: ' + w + ';<br />';
    s.innerHTML += 'Height: ' + h + ';<br />';
    s.innerHTML += 'Amount: ' + amt + ';<br />';
    s.innerHTML += '<br />Colors:<br />';
    s.innerHTML += 'Green: Random Node;<br />';
    s.innerHTML += 'White: Node Created By Raycast;<br />';
    s.innerHTML += 'Red Line: node edge;<br />';
    s.innerHTML += 'Light Blue line: pathfound path;<br />';
    s.innerHTML += 'Light Blue: start/end;<br />';
}
const speed = params.get('slow') != null;

async function dof() {
    try {
        await doOP();
    } catch (e) {
        failedRuns += 1;
        console.error(e);
        if (ele) {
            ele.innerText = createMes();
        }
    }
}

async function main() {
    settings();
    if (speed) {
        document.body.addEventListener("keydown", (e) => {
            if (e.code == 'ArrowRight') {
                dof();
            }
        });
        const butt = document.createElement('button');
        butt.className = 'btn btn-primary';
        butt.addEventListener('click', dof);
        butt.innerText = 'next';
        document.body.appendChild(butt);
        dof();
    }
    while (!speed) {
        dof();
        if (timePathfind.length == count) {
            break;
        }
        await new Promise((r) => {
            setTimeout(r, 1);
        });
    }
}
main();

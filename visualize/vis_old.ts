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
//import { createGzip } from "zlib";

const params = new URLSearchParams(window.location.search);
function intParam(name: string, defaul: number | number[]): number | number[] {
    const o = params.get(name);
    if (o == null) {
        return defaul;
    } else {
        return parseInt(o);
    }
}

const amt = intParam('amt', 30) as number;
const count = intParam('count', 100) as number;
const w = intParam('w', 800) as number;
const h = intParam('h', 800) as number;

const conAmt = 1;
const padding = 0;
const ele = document.getElementById('mes');
const timeNodes: number[] = [];
const rayTimes: number[] = [];
let failedRuns = 0;
const timePathfind: number[] = [];
const average = (array: number[]) => array.reduce((a, b) => a + (b || 0), 0) / array.length;
const extraNodes: number[] = [];
const pathLengths: number[] = [];
function createMes() {
    let msg = amt + ' nodes; ';
    msg += 'randomNodes: ' + average(timeNodes).toFixed(5) + 'ms; ';
    msg += 'raycast: ' + average(rayTimes).toFixed(5) + 'ms; ';
    msg += 'pathfind: ' + average(timePathfind).toFixed(5) + 'ms; ';
    msg += 'extra nodes: ' + average(extraNodes).toFixed(5) + '; ';
    msg += 'averagePathLength: ' + average(pathLengths).toFixed(5) + '; ';
    msg +=
        'runs: ' +
        Math.floor(average([timeNodes.length, timePathfind.length])) +
        '/' +
        count +
        ' f:' +
        failedRuns +
        ';';
    return msg;
}

const canva = document.getElementsByTagName('canvas')[0];
if (!canva) {
    throw new Error('of');
}

canva.id = 'cring';
canva.width = w;
canva.height = h;
//alert("canvas created")

const dt = document.getElementById('data');
let datas: any[] = [];

const ctx = canva.getContext('2d');

// console.log(w/amt, h/amt)
const scale: (x: number, y: number) => [number, number] = (x, y) => {
    return [(x / amt) * w, (y / amt) * h];
};
async function doOP() {
    if (!ctx) {
        alert('unable to establish canvas context!');
        throw new Error('Cnva');
    }
    ctx.scale(1, 1); // maybe scale so we dont have to use a scale function?
    //alert("canvas context")
    //a("adding child")
    //alert("nodes")
    const t1 = performance.now();
    const _nodes = randomNodes2(amt as number, w, h, 5, 5, conAmt);
    const t2 = performance.now();
    // const _nodes2 = [{ x: 5, y: 5, edges:[] }, { x: 15, y: 10, edges: [] }, { x: 25, y: 5, edges:[] }]
    const _nodes2 = _nodes.map((r) => {
        return { ...r, edges: new Set<number>() };
    });
    // const _nodes2 = [{"x":92,"y":59,"edges":[]},{"x":47,"y":85,"edges":[]},{"x":12,"y":75,"edges":[]},{"x":131,"y":33,"edges":[]},{"x":117,"y":21,"edges":[]},{"x":145,"y":112,"edges":[]},{"x":21,"y":57,"edges":[]},{"x":98,"y":89,"edges":[]},{"x":108,"y":90,"edges":[]},{"x":95,"y":144,"edges":[]},{"x":24,"y":18,"edges":[]},{"x":43,"y":138,"edges":[]},{"x":52,"y":2,"edges":[]},{"x":140,"y":98,"edges":[]},{"x":83,"y":51,"edges":[]},{"x":72,"y":113,"edges":[]},{"x":69,"y":78,"edges":[]},{"x":125,"y":71,"edges":[]},{"x":5,"y":23,"edges":[]},{"x":121,"y":106,"edges":[]},{"x":36,"y":95,"edges":[]},{"x":117,"y":29,"edges":[]},{"x":42,"y":6,"edges":[]},{"x":37,"y":61,"edges":[]},{"x":107,"y":54,"edges":[]},{"x":122,"y":126,"edges":[]},{"x":84,"y":102,"edges":[]},{"x":87,"y":136,"edges":[]},{"x":38,"y":47,"edges":[]},{"x":69,"y":146,"edges":[]},{"x":67,"y":0,"edges":[]},{"x":118,"y":144,"edges":[]},{"x":112,"y":99,"edges":[]},{"x":52,"y":113,"edges":[]},{"x":27,"y":58,"edges":[]},{"x":113,"y":65,"edges":[]},{"x":37,"y":36,"edges":[]},{"x":69,"y":132,"edges":[]},{"x":28,"y":70,"edges":[]},{"x":124,"y":118,"edges":[]},{"x":91,"y":41,"edges":[]},{"x":80,"y":65,"edges":[]},{"x":64,"y":50,"edges":[]},{"x":106,"y":69,"edges":[]},{"x":20,"y":21,"edges":[]},{"x":77,"y":45,"edges":[]},{"x":39,"y":112,"edges":[]},{"x":135,"y":74,"edges":[]},{"x":106,"y":62,"edges":[]},{"x":129,"y":72,"edges":[]},{"x":74,"y":119,"edges":[]},{"x":54,"y":90,"edges":[]},{"x":99,"y":25,"edges":[]},{"x":36,"y":101,"edges":[]},{"x":112,"y":121,"edges":[]},{"x":119,"y":112,"edges":[]},{"x":116,"y":46,"edges":[]},{"x":37,"y":46,"edges":[]},{"x":4,"y":122,"edges":[]},{"x":36,"y":74,"edges":[]},{"x":39,"y":120,"edges":[]},{"x":108,"y":77,"edges":[]},{"x":19,"y":31,"edges":[]},{"x":128,"y":53,"edges":[]},{"x":59,"y":98,"edges":[]},{"x":78,"y":104,"edges":[]},{"x":82,"y":118,"edges":[]},{"x":66,"y":70,"edges":[]},{"x":103,"y":39,"edges":[]},{"x":138,"y":22,"edges":[]},{"x":111,"y":21,"edges":[]},{"x":48,"y":79,"edges":[]},{"x":28,"y":27,"edges":[]},{"x":123,"y":129,"edges":[]},{"x":90,"y":55,"edges":[]},{"x":85,"y":29,"edges":[]},{"x":12,"y":83,"edges":[]},{"x":81,"y":78,"edges":[]},{"x":70,"y":2,"edges":[]},{"x":49,"y":68,"edges":[]},{"x":104,"y":73,"edges":[]},{"x":42,"y":23,"edges":[]},{"x":35,"y":75,"edges":[]},{"x":112,"y":23,"edges":[]},{"x":63,"y":69,"edges":[]},{"x":43,"y":64,"edges":[]},{"x":83,"y":22,"edges":[]},{"x":58,"y":63,"edges":[]},{"x":86,"y":15,"edges":[]},{"x":116,"y":138,"edges":[]},{"x":96,"y":105,"edges":[]},{"x":87,"y":90,"edges":[]},{"x":46,"y":98,"edges":[]},{"x":21,"y":67,"edges":[]},{"x":63,"y":120,"edges":[]},{"x":89,"y":50,"edges":[]},{"x":109,"y":72,"edges":[]},{"x":60,"y":142,"edges":[]},{"x":45,"y":91,"edges":[]},{"x":61,"y":135,"edges":[]},{"x":76,"y":14,"edges":[]},{"x":33,"y":58,"edges":[]},{"x":93,"y":44,"edges":[]},{"x":119,"y":70,"edges":[]},{"x":9,"y":66,"edges":[]},{"x":48,"y":140,"edges":[]},{"x":73,"y":55,"edges":[]},{"x":41,"y":122,"edges":[]},{"x":127,"y":22,"edges":[]},{"x":131,"y":119,"edges":[]},{"x":91,"y":79,"edges":[]},{"x":97,"y":24,"edges":[]},{"x":126,"y":1,"edges":[]},{"x":73,"y":129,"edges":[]},{"x":30,"y":4,"edges":[]},{"x":119,"y":28,"edges":[]},{"x":71,"y":95,"edges":[]},{"x":21,"y":140,"edges":[]},{"x":108,"y":72,"edges":[]},{"x":39,"y":43,"edges":[]},{"x":109,"y":92,"edges":[]},{"x":122,"y":36,"edges":[]},{"x":89,"y":7,"edges":[]},{"x":102,"y":103,"edges":[]},{"x":41,"y":33,"edges":[]},{"x":59,"y":93,"edges":[]},{"x":38,"y":4,"edges":[]},{"x":51,"y":34,"edges":[]}]
    //console.log(_nodes2)

    // const walls = [{sx: 20, sy: 50, ex: 20, ey: 100 }, {sx: 50, sy: 100, ex: 100, ey: 100 }]
    const walls = randomWalls2(10, w, h, 10, 200);
    // const walls = [{sx: 10, sy: 0, ex: 10, ey: 9}, {sx: 20, sy: 0, ex: 20, ey: 10}]
    const t6 = performance.now();
    // navigator.clipboard.writeText(JSON.stringify(_nodes2))
    const nodes = await Raycast(
        _nodes2,
        walls,
        /*(data: HookData, nodes?: Node[], walls?: Line[]) => {
            datas.push({ data, nodes, walls });
        }*/
    );
    // console.log(nodes)
    const t7 = performance.now();
    ctx.clearRect(0, 0, canva.width, canva.height);
    walls.forEach((wall) => {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.moveTo(...scale(wall.sx, wall.sy));
        ctx.lineTo(...scale(wall.ex, wall.ey));
        ctx.stroke();
    });
    //alert("nodesDone")
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    //alert(nodes.length)
    nodes.forEach((node, i) => {
        //if (node.raycast) return;
        ctx.moveTo(...scale(node.x, node.y));
        ctx.strokeStyle = 'red';
        node.edges.forEach((edge) => {
            //if (!nodes[edge].raycast) return;
            ctx.beginPath();
            ctx.moveTo(...scale(node.x, node.y));
            ctx.lineTo(...scale(nodes[edge].x, nodes[edge].y));
            ctx.stroke();
        });
    });
    nodes.forEach((node, i) => {
        const [nx, ny] = scale(node.x, node.y);
        if (i >= amt) {
            ctx.strokeStyle = 'blue';
            ctx.fillStyle = 'blue';
        } else {
            ctx.strokeStyle = node.raycast ? 'red' : 'green';
            ctx.fillStyle = node.raycast ? 'red' : 'green';
        }
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    });
    const t3 = performance.now();
    // const path = await AStar(Math.floor(0.5 * amt), Math.floor(0.4 * amt), nodes)
    try {
        const path = await AStar(0, 2, nodes);
        const t4 = performance.now();
        timePathfind.push(t4 - t3);
        timeNodes.push(t2 - t1);
        pathLengths.push(path.length);
        rayTimes.push(t7 - t6);
        extraNodes.push(nodes.length - amt);
        const f = nodes[path[0]];
        const end = nodes[path[path.length - 1]];
        ctx.strokeStyle = 'lightblue';
        ctx.fillStyle = 'lightblue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(scale(f.x, f.y)[0], scale(f.x, f.y)[1], 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.moveTo(...scale(end.x, end.y));
        ctx.arc(scale(end.x, end.y)[0], scale(end.x, end.y)[1], 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.moveTo(...scale(f.x, f.y));
        ctx.stroke();
        path.forEach((i) => {
            ctx.lineTo(...scale(nodes[i].x, nodes[i].y));
        });
        ctx.stroke();
    } catch (e) {
        console.log(e);
    }
    if (ele != undefined) {
        ele.innerText = createMes();
    }
    if (dt) {
        //dt.innerText = JSON.stringify(datas,null)
    }
}

function settings() {
    const s = document.getElementById('settings');
    if (!s) {
        return;
    }
    s.innerHTML = 'Settings: <br />';
    s.innerHTML += 'slow: ' + speed + ';<br />';
    s.innerHTML += 'w: ' + w + ';<br />';
    s.innerHTML += 'h: ' + h + ';<br />';
    s.innerHTML += 'amt: ' + amt + ';<br />';
    s.innerHTML += '<br />colors:<br />';
    s.innerHTML += 'green: random node;<br />';
    s.innerHTML += 'blue: node added by raycast;<br />';
    s.innerHTML += 'red line: node edge;<br />';
    s.innerHTML += 'light blue line: pathfound path;<br />';
    s.innerHTML += 'light blue: start/end;<br />';
}
const speed = params.get('slow') != null;

async function drawDatas(
    datas: {
        nodes: Node[];
        walls: Line[];
        entries: Entry[];
        hits: Entry[] | null;
        edge: Point;
        anyLine: Line | null;
        ray: RayE | null;
        info: string;
    }[]
) {
    if (!ctx) return;
    if (!speed) return;
    for (const step of datas) {
        if (step.ray) {
            ctx.beginPath();
            ctx.strokeStyle = 'purple';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.moveTo(...scale(step.ray.l.sx, step.ray.l.sy));
            ctx.lineTo(...scale(step.ray.l.ex, step.ray.l.ey));
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        await new Promise((r) => {
            setTimeout(r, 10);
        });
    }
}

async function dof() {
    datas = [];
    try {
        await doOP();
    } catch (e) {
        failedRuns += 1;
        console.error(e);
        if (ele) {
            ele.innerText = createMes();
        }
        if (dt) {
            //dt.innerText = JSON.stringify(datas,null)
        }
    }
    // drawDatas(datas);
    //console.log(datas)
}
async function main() {
    settings();
    if (speed) {
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

import {
    HookData,
    Node,
    HookDataType,
    randomNodes,
    randomWalls,
    Raycast,
    Line,
    Point,
    RayE,
} from '../../src/astar';
const s = 16;
const nodes: Node[] = JSON.parse(
    localStorage.getItem('nodes') ||
        JSON.stringify(
            randomNodes(s, 1).map((e) => {
                return { ...e, edges: new Set<number>() };
            })
        )
).map((n: Node & { edges: number[] | Set<number> }) => {
    // stupid JSON dont know how to store sets
    n.edges = new Set((n.edges as number[]).length > 0 ? n.edges : []);
    return n;
});
if (nodes.length != s) {
    localStorage.removeItem("nodes");
    location.reload()
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
const walls = randomWalls(Math.floor(s/8), nw, 4);
const wh: number[] = [];
const ww: number[] = [];
walls.forEach((element) => {
    ww.push(element.sx, element.ex);
    wh.push(element.sy, element.ey);
});
const w = Math.max.apply(null, [...ww, nw]);
const h = Math.max.apply(null, [...wh, nh]);

const steps: HookData[] = [];
let currentStep = 0;
let autoplay = false;
let autoplayTimer: NodeJS.Timeout;
const canvas = document.getElementById('canva') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

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

const casted = Raycast(nodes, walls, (n, w, d) => {
    steps.push(d);
});

const dt = document.getElementById('info');
if (dt) {
    dt.innerText =
        s +
        ' nodes; ' +
        casted.length +
        ' after cast; ' +
        steps.length +
        ' steps (0-' +
        (steps.length - 1) +
        ');';
}

function drawLine(l: Line, style: string, strokeWidth: number = 1) {
    ctx.beginPath();
    const scaledS = { x: (l.sx / w) * 512, y: (l.sy / h) * 512 };
    const scaledE = { x: (l.ex / w) * 512, y: (l.ey / h) * 512 };
    ctx.strokeStyle = style;
    ctx.lineWidth = strokeWidth;
    ctx.moveTo(scaledS.x, scaledS.y);
    ctx.lineTo(scaledE.x, scaledE.y);
    ctx.stroke();
}

function drawDot(p: Point, radius: number, style: string) {
    ctx.beginPath();
    ctx.strokeStyle = style;
    ctx.fillStyle = style;
    ctx.arc((p.x / w) * 512, (p.y / h) * 512, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

function drawStep(st: HookData) {
    switch (st.type) {
        case HookDataType.RayConstructed:
            console.clear();
            drawLine(st.ray.l, 'lightblue');
            drawDot(nodes[st.ray.ref], 3, 'lightblue');
            break;
        case HookDataType.RayHits:
            console.log(st.hits);
            drawLine(st.ray.l, 'blue');
            drawDot(nodes[st.ray.ref], 3, 'blue');
            st.hits.forEach((h) => {
                if (h.ref == st.ray.ref) {
                    return;
                }
                switch (h.t) {
                    case 'node':
                        drawDot(h.c, 3, 'blue');
                        break;
                    case 'wall':
                        drawLine(h.ref, 'blue');
                        break;
                    case 'ray':
                        drawLine(h.l, 'blue');
                        break;
                }
            });
            break;
        case HookDataType.HitNode:
            drawDot(nodes[st.hit.ref as number], 3, 'green');
            drawLine(st.ray.l, 'green');
            break;
        case HookDataType.HitWall:
            drawLine(st.hit.ref as Line, 'green');
            drawLine(st.ray.l, 'green');
            break;
        case HookDataType.Finished:
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            casted.forEach((c) => {
                drawDot(c, 3, c.raycast ? 'orange' : 'green');
                c.edges.forEach((ed) => {
                    drawLine({ sx: c.x, sy: c.y, ex: nodes[ed].x, ey: nodes[ed].y }, 'green');
                });
            });
            walls.forEach((w) => {
                drawLine(w, 'yellow');
            });
            break;
        case HookDataType.HitRay:
            drawLine((st.hit as RayE).l, 'green');
            drawLine(st.ray.l, 'green');
            break;
        case HookDataType.HitRayNewNode:
            drawLine((st.hit as RayE).l, 'green');
            drawLine(st.ray.l, 'green');
            drawDot(st.newNode, 3, 'green');
            break;
    }
}

function draw() {
    const cstep = steps[currentStep];
    (document.getElementById('cstep') as HTMLPreElement).innerText = JSON.stringify(cstep, null, 2);
    (document.getElementById('cstepInfo') as HTMLDivElement).innerText =
        cstep.info + ' (' + HookDataType[cstep.type] + ')';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cstep.entries.forEach((t) => {
        switch (t.t) {
            case 'node':
                drawDot(t.c, 2, nodes[t.ref].raycast ? 'orange' : 'red');
                break;
            case 'wall':
                drawLine(t.ref, 'yellow');
                break;
            case 'ray':
                drawLine(t.l, 'purple');
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

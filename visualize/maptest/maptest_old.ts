import {
    Raycast,
    svgToPaths,
    generateNodes,
    generateWalls,
    Node,
    AStar,
    HookData,
    HookDataType,
} from '../../src/astar';
import { Line } from '../../src/col';
import { defaultFilterFunction } from '../../src/generateNodesFromSVG';

import { createCircle, createLayer, createLine, createPath } from '../svgEdit';

// @ts-ignore
import JsonViewer from 'json-viewer-js';
//import eruda from "../eruda";

const _d = new URL('./BHS_Building_Map_SVG.svg', import.meta.url);
// @ts-ignore
import _dt from 'bundle-text:./BHS_Building_Map_SVG.svg';
// (async () => { _dt = await fetch(_d.href).then((r) => { return r.text() }) })();

function createElement(str: string): Element | null {
    const temp = document.createElement('template');
    str = str.trim();
    temp.innerHTML = str;
    return temp.content.firstElementChild;
}

const map_svg = createElement(_dt) as SVGSVGElement;
if (map_svg) {
    map_svg.id = 'map-svg';
    map_svg.setAttribute('width', '100%');
    map_svg.setAttribute('height', '');
    document.body.replaceChild(map_svg, document.getElementById('map-svg') as Element);
    // document.getElementById('pathfinding').style.display = 'inline'
}

const svgDrawLayer = createLayer(map_svg, 'svg-draw-layer', true);

// Silly mobile
const dpi = window.devicePixelRatio <= 2.84 ? window.devicePixelRatio : 2.84;
const w = 1920;
const h = 1080;
const padding = 42;

const canva = document.getElementsByTagName('canvas')[0];
if (!canva) {
    throw new Error('of');
}

const img = new Image();
canva.id = 'display';
canva.width = w * dpi;
canva.height = h * dpi;

canva.style.width = '100%';

const ctx = canva.getContext('2d');
ctx?.scale(dpi, dpi);

// For the raycast
let datas: any[] = [];
let walls: { sx: number; sy: number; ex: number; ey: number }[] = [];
let nodes: Node[] = [];

let debounce = false;
var pt = (map_svg as SVGSVGElement).createSVGPoint();
if (map_svg === null) {
    throw new Error('map_svg is null');
}

map_svg.addEventListener('click', function (e) {
    pt.x = e.clientX;
    pt.y = e.clientY;

    // The cursor point, translated into svg coordinates
    var cursorpt = pt.matrixTransform(map_svg.getScreenCTM()?.inverse());
    console.log('(' + cursorpt.x + ', ' + cursorpt.y + ')');
    createCircle(svgDrawLayer, cursorpt.x, cursorpt.y, 'purple', 2.5, 0.5);
    nodes.push({
        x: +cursorpt.x.toFixed(),
        y: +cursorpt.y.toFixed(),
        edges: new Set<number>(),
    });

    render().then(() => {
        debounce = false;
    });
});

canva.addEventListener(
    'click',
    function (e) {
        if (debounce) return;
        debounce = true;

        var rect = canva.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / (rect.right - rect.left)) * canva.width;
        var y = ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canva.height;

        if (e.shiftKey) {
            walls.push({
                sx: x / dpi - 10,
                sy: y / dpi - 10,
                ex: x / dpi + 10,
                ey: y / dpi - 10,
            });
            render().then(() => {
                debounce = false;
            });
            return;
        }

        if (ctx === null) {
            console.log('click, but ctx is null');
            return;
        }

        // var rect = canva.getBoundingClientRect();
        // var x = ((e.clientX  - rect.left) / (rect.right - rect.left) * canva.width);
        // var y = ((e.clientY  - rect.top) / (rect.bottom  - rect.top) * canva.height);

        // console.log(x, y)
        nodes.push({
            x: +(x / dpi).toFixed(),
            y: +(y / dpi).toFixed(),
            edges: new Set<number>(),
        });

        render().then(() => {
            debounce = false;
        });
    },
    false
);

function raycastHook(nodes: Node[], walls: Line[], data: HookData) {
    //console.log(HookDataType[data.type], data);
    // render(false);
    if (ctx === null) return;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.strokeStyle = 'purple';
    ctx.moveTo(10, 10);
    ctx.lineTo(100, 10);
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = 'white';
    ctx.fillText(data.info, 50, 10);
}

async function render(reRaycast: boolean = true) {
    if (ctx === null) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);

    if (reRaycast) {
        if (nodes.length == 0 || walls.length == 0) {
            const svgPaths = await svgToPaths(_dt, defaultFilterFunction);

            walls = await generateWalls(svgPaths);

            nodes = await Raycast(
                await generateNodes(svgPaths),
                walls,
                (data: HookData, nodes?: Node[], walls?: Line[]) => {
                    datas.push({ nodes, walls, data });
                }
            );
        } else {
            datas = [];
            nodes = await Raycast(
                nodes,
                walls,
                (data: HookData, nodes?: Node[], walls?: Line[]) => {
                    datas.push({ data });
                }
            );
        }
    }

    // console.log("Nodes: ", nodes);
    // console.log("Walls: ", walls);

    walls.forEach((wall) => {
        createPath(svgDrawLayer, `M${wall.sx} ${wall.sy} L${wall.ex} ${wall.ey} Z`, 'orange', 2);
    });

    nodes.forEach((node, i) => {
        // console.log(node,i)
        ctx.moveTo(node.x, node.y);
        node.edges.forEach((edge) => {
            const lineColor = nodes[edge].raycast ? 'red' : 'green';
            createPath(
                svgDrawLayer,
                `M${node.x} ${node.y} L${nodes[edge].x} ${nodes[edge].y} Z`,
                lineColor,
                4
            );

            /*
            ctx.fillStyle = 'white';
            const dist = Math.sqrt(
                Math.pow(nodes[edge].x - node.x, 2) + Math.pow(nodes[edge].y - node.y, 2)
            );
            const dir = Math.atan2(nodes[edge].y - node.y, nodes[edge].x - node.x);
            // draw the text between the two connecting nodes and somehow also make the text not draw over already drawn text by using the direction to slightly offset the text closer to the node it started from
            //ctx.fillText(`N ${i}, E ${edge}`, node.x + (Math.cos(dir) * dist / 2) + 5 + (Math.cos(dir) === -1 || Math.cos(dir) === 1 ? 10 : 0), node.y + (Math.sin(dir) * dist / 2) + (Math.sin(dir) === 0 || Math.sin(dir) === -1 ? 10 : 0));
            */
        });
    });

    nodes.forEach((node, i) => {
        const fillColor = node?.raycast ? 'red' : 'green';
        const strokeColro = node?.raycast ? 'red' : 'green';
        createCircle(svgDrawLayer, node.x, node.y, fillColor, 2.5);
    });

    nodes.forEach((node, i) => {
        /*
        if (node.raycast) {
            ctx.fillStyle = 'black';
            ctx.fillText(
                 // `${i} - [${node.x}, ${node.y}] : ${node.edges}`,
                `${i}`,
                node.x - 4, // + 10,
                node.y + 2 //
            );
            return;
        }
        */
        // if (![42, 6, 86, 87, 88, 89, 90, 91, 92, 64].includes(i)) return;

        ctx.fillStyle = 'white'; // "gray";
        // ctx.strokeText(i + ';' +node.x + ', ' + node.y + ':' + node.edges, 5 + node.x, 5+ node.y)
        ctx.fillText(
            /* `${i} - [${node.x}, ${node.y}] : ${node.edges}`, */
            `${i}`,
            node.x, //,
            node.y // - 10
        );
    });

    try {
        const path = await AStar(22, 29, nodes);
        console.log(
            path.map((p, ppi) => {
                return { p: p, e: nodes[p].edges };
            })
        );

        path.forEach((p) => {
            const nnn = nodes[p];
            const [nx, ny] = [nnn.x, nnn.y];
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = 'lightblue';
            ctx.beginPath();
            ctx.arc(nx, ny, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = 1;
        });

        // let dPath = '';
        path.forEach((i, ii) => {
            ctx.lineTo(nodes[i].x, nodes[i].y);

            if (nodes[path[ii + 1]]) {
                const dPath = `M${nodes[i].x} ${nodes[i].y} L${nodes[path[ii + 1]].x} ${
                    nodes[path[ii + 1]].y
                } Z`;
                createPath(svgDrawLayer, dPath, 'lightblue', 2, 0.8);
            }
            //createCircle(svgDrawLayer, nodes[i].x, nodes[i].y, 'lightblue', 4, 0.8);

            /* // Might be easier
            if (ii !== 0) {
                dPath += `L${nodes[i].x} ${nodes[i].y} M${nodes[i].x} ${nodes[i].y} `;
            } else {
                dPath += `M${nodes[i].x} ${nodes[i].y} `;
            }
            */
        });

        const f = nodes[path[0]];
        const end = nodes[path[path.length - 1]];

        createCircle(svgDrawLayer, f.x, f.y, 'yellow', 5, 0.5);
        createCircle(svgDrawLayer, end.x, end.y, 'yellow', 5, 0.5);

        ctx.strokeStyle = 'yellow';
        ctx.fillStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.moveTo(end.x, end.y);
        ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.moveTo(f.x, f.y);
        ctx.stroke();

        // ctx.stroke();
        // ctx.globalAlpha = 1;
        // ctx.lineWidth = 1;
    } catch (e) {
        console.log(e);
    }

    // grid, great for debugging
    /*
    for (let iw = 0; iw < w; iw += 50) {
        ctx.strokeStyle = "gray"
        ctx.beginPath();
        ctx.moveTo(iw, 0);
        ctx.lineTo(iw, h);
        ctx.stroke();

        for (let ih = 0; ih < h; ih += 50) {
            ctx.beginPath();
            ctx.moveTo(0, ih);
            ctx.lineTo(w, ih);
            ctx.stroke();

            
            if (ih%100 === 0 && iw%100 === 0) {
                ctx.beginPath()
                ctx.arc(iw, ih, 2, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = 'white';
                ctx.fillText(`[${iw.toString()}, ${ih.toString()}]`, iw, ih);
            }
        }
    }
    */
    //drawDatas(datas);
    /*
    (document.getElementById('data') as HTMLDivElement).innerText = JSON.stringify(
        nodes,
        (_key, value) => (value instanceof Set ? [...value] : value)
    );
    */
    (document.getElementById('data') as HTMLDivElement).innerHTML = '';
    new JsonViewer({
        container: document.getElementById('data'),
        data: JSON.stringify(nodes, (key, value) => {
            // fix the problem where entries is blank. cause this lib doesnt know how to convert a set to an array
            return value instanceof Set ? [...value] : value;
        }),
        theme: 'dark',
        expand: false,
    });
}

async function drawDatas(datas: { nodes: Node[]; walls: Line[]; data: HookData }[]) {
    if (!ctx) return;
    // if (!speed) return;
    for (const step of datas) {
        if (step.data.type == HookDataType.Finished) {
            continue;
        }
        if (step.data.ray) {
            if (!(step.nodes.indexOf(step.data.node) === 17)) continue;
            //console.log(HookDataType[step.data.type], step.data)
            if (step.data.type !== HookDataType.HitWall) continue;
            if (!step.data.collisionPos) {
                console.log('collision pos is false, how? idk: ', step.data.collisionPos);
                continue;
            }
            ctx.beginPath();
            ctx.strokeStyle = 'purple';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.moveTo(step.data.node.x, step.data.node.y);
            ctx.lineTo(step.data.collisionPos.x, step.data.collisionPos.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        await new Promise((r) => {
            setTimeout(r, 1);
        });
    }
}

async function main() {
    img.onload = function () {
        render();
    };
    img.src = _d.href;
}

main();
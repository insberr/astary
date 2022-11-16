import {
    Raycast,
    randomNodes3,
    LineRay,
    NewNode,
    NewWall,
    AStar,
    HookData,
    HookDataType,
    Point,
} from '../../src/astar';

import {
    clearG,
    createCircle,
    createLayer,
    createLine,
    createPath,
    createText,
    deleteDraw,
} from '../svgEdit';

import * as _ from 'lodash';
//import eruda from "../eruda";

// @ts-ignore
import JsonViewer from 'json-viewer-js';
import { LineSegment } from '../../dist/astar';

function createElement(str: string): Element | null {
    const temp = document.createElement('template');
    str = str.trim();
    temp.innerHTML = str;
    return temp.content.firstElementChild;
}

const ele = document.getElementById('mes');
let perRaycast: number[] = [0];
let perRender: number[] = [0];
let perRenderDrawing: number[] = [0];
function avg(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function createMes() {
    if (perRenderDrawing.length > 10000) {
        perRenderDrawing = perRenderDrawing.slice(5000, 10000);
    }
    let msg = `\
Amount of Nodes: ${amount} \
\nWidth x Height: ${width} x ${height} \
\n\n**Timings** \
\nRender: ${avg(perRender)}ms \
\nRaycast: ${avg(perRaycast)}ms\
\nUser Drawing: ${avg(perRenderDrawing)}ms`;
    // msg += `Func randomNodes2: ${average(timeNodes).toFixed(5)}ms \n`;
    // msg += `Func randomWalls2: ${average(timeNodes).toFixed(5)}ms \n`;
    // msg += 'Raycast: ' + average(rayTimes).toFixed(5) + 'ms; \n';
    // msg += 'Pathfind: ' + average(timePathfind).toFixed(5) + 'ms; \n';
    // msg += 'Raycast Created Nodes: ' + average(extraNodes).toFixed(5) + '; \n';
    // msg += 'Average Path Length: ' + average(pathLengths).toFixed(5) + '; \n';
    // msg += `Runs: ${average([
    //     timeNodes.length,
    //     timePathfind.length,
    // ])}/${count} & ${failedRuns} Failed \n`;
    if (ele) {
        ele.innerText = msg;
    } else {
        console.log('complain about it. theres no info element');
    }
}

// map_svg.id = 'map-svg';
// map_svg.setAttribute('width', '100%');
// map_svg.setAttribute('height', '');
// document.body.replaceChild(map_svg, document.getElementById('map-svg') as Element);
// document.getElementById('pathfinding').style.display = 'inline'; // Show the pathfinding drawings
const width = 50;
const height = 50;
const amount = 10;
const genRandom: boolean = false;
const overideRenderTimeout: number | null = 10;
const stressTest = false;
const size = 1;

const drawSvg = document.getElementById('drawing-svg');
if (drawSvg === null) {
    throw new Error('drawSvg is null');
}
let svgDrawLayer = createLayer(drawSvg, 'svg-draw-layer', true);
if (svgDrawLayer === null) {
    new Error('drawingLayer is null, Attempting to create layer');
    svgDrawLayer = createLayer(drawSvg, 'drawing-layer');
}
drawSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

// For the raycast
let originalNodes: NewNode[] = genRandom
    ? randomNodes3(amount, width, height, { padding: 10, distance: 5, alignment: 5 })
    : [
          { x: 5, y: 5, edges: {} },
          { x: 10, y: 2, edges: {} },
          { x: 20, y: 10, edges: {} },
          { x: 2, y: 10, edges: {} },
          { x: 20, y: 25, edges: {} },
      ];
let nodes: NewNode[] = _.cloneDeep(originalNodes);
// @ts-ignore
window.nodes = nodes;
let datas: any[] = [];
let walls: NewWall[] = [
    { s: { x: 15, y: 0 }, e: { x: 15, y: 15 } },
    // { s: { x: 1, y: 17 }, e: { x: 12, y: 17 } },
];
let rays: LineRay[] = [];

let debounce = false;
let renderDebounce = false;
// @ts-ignore
const pt = (drawSvg as SVGSVGElement).createSVGPoint(); // https://stackoverflow.com/a/42711775/13606260
let savePoint: Point | null = null;
drawSvg.addEventListener('mousemove', function (e) {
    if (debounce) return;
    debounce = true;
    deleteDraw(svgDrawLayer, 'cursor-follow');
    deleteDraw(svgDrawLayer, 'cursor-follow-line');
    pt.x = e.clientX;
    pt.y = e.clientY;

    //     // ====== https://stackoverflow.com/a/42711775/13606260
    //     // The cursor point, translated into svg coordinates
    // @ts-ignore
    var cursorpt = pt.matrixTransform(drawSvg.getScreenCTM()?.inverse());
    //     // console.log('(' + cursorpt.x + ', ' + cursorpt.y + ')');
    //     // ====== End
    //     createCircle(svgDrawLayer, cursorpt.x, cursorpt.y, 'purple', 2.5, 0.5);
    //     nodes.push({
    //         x: +cursorpt.x.toFixed(),
    //         y: +cursorpt.y.toFixed(),
    //         edges: new Set<number>(),
    //     });

    createText(
        svgDrawLayer,
        cursorpt.x,
        cursorpt.y,
        `x: ${cursorpt.x.toFixed(2)}, y: ${cursorpt.y.toFixed(2)}`,
        'orange',
        2,
        '',
        0.5,
        'cursor-follow'
    );
    if (savePoint !== null) {
        createLine(
            svgDrawLayer,
            savePoint.x,
            savePoint.y,
            cursorpt.x,
            cursorpt.y,
            0.5,
            'orange',
            0.5,
            'cursor-follow-line'
        );
        const existing = walls.filter((w) => w.s.x === savePoint?.x && w.s.y === savePoint?.y);
        if (existing.length !== 0) {
            walls.pop();
        }
        walls.push({ s: savePoint, e: { x: cursorpt.x, y: cursorpt.y } });
        if (!renderDebounce) {
            renderDebounce = true;
            const perUserDrawingStart = performance.now();
            render().then(() => {
                const perUserDrawingEnd = performance.now();
                perRenderDrawing.push(perUserDrawingEnd - perUserDrawingStart);
                createMes();
                setTimeout(() => {
                    renderDebounce = false;
                    // render();
                }, overideRenderTimeout || 10 * (nodes.length * 0.5));
            });
        }
    }
    debounce = false;
});

async function addDrawPoint(x: number, y: number) {
    if (x === undefined || y === undefined) {
        // @ts-ignore
        var cursorpt = pt.matrixTransform(drawSvg.getScreenCTM()?.inverse());
        x = cursorpt.x;
        y = cursorpt.y;
    }
    savePoint = { x: x, y: y };
    createCircle(svgDrawLayer, x, y, 'orange', 0.5, 0.5);
}
drawSvg.addEventListener('mouseup', function (e) {
    // deleteDraw(svgDrawLayer, 'cursor-follow');
    pt.x = e.clientX;
    pt.y = e.clientY;

    // @ts-ignore
    var cursorpt = pt.matrixTransform(drawSvg.getScreenCTM()?.inverse());
    // savePoint = { x: +cursorpt.x.toFixed(2), y: +cursorpt.y.toFixed(2) };
    // createCircle(svgDrawLayer, +cursorpt.x.toFixed(2), +cursorpt.y.toFixed(2), 'orange', 0.5, 0.5);
    addDrawPoint(+cursorpt.x.toFixed(2), +cursorpt.y.toFixed(2));
});

async function escapeDraw() {
    savePoint = null;
    deleteDraw(svgDrawLayer, 'cursor-follow-line');
    walls.pop();
    render();
}
// @ts-ignore
window.escapeDraw = escapeDraw;
// @ts-ignore
window.addDrawPoint = addDrawPoint;

window.addEventListener('keyup', function (e) {
    if (e.key === 'Escape') {
        escapeDraw();
    }
});

function raycastHook(nodes: NewNode[], walls: NewWall[], data: HookData) {
    // pointless
    return;
}

async function render(reRaycast: boolean = true) {
    const perRenderStart = performance.now();
    clearG(svgDrawLayer);

    if (reRaycast) {
        if (nodes.length == 0 || walls.length == 0) {
            throw new Error('TEMPORARY: nodes or walls is empty');
            // const svgPaths = await svgToPaths(_dt, defaultFilterFunction);

            // walls = await generateWalls(svgPaths);

            // nodes = await Raycast(
            //     await generateNodes(svgPaths),
            //     walls,
            //     0,
            //     (data: HookData, nodes?: NewNode[], walls?: NewWall[]) => {
            //         datas.push({ nodes, walls, data });
            //     }
            // );
        } else {
            datas = [];
            const perRaycastStart = performance.now();
            let { nodes: n, rays: r } = await Raycast(_.cloneDeep(originalNodes), walls, {
                width: width,
                height: height,
                // maxConnections: 2,
            });
            const perRaycastEnd = performance.now();
            perRaycast.push(perRaycastEnd - perRaycastStart);
            nodes = n;
            rays = r;
        }
    }

    // nodes.forEach((node, i) => {
    //     node.edges.forEach((edge) => {
    //         const lineColor = nodes[edge].raycast ? 'red' : 'green';
    //         createPath(
    //             svgDrawLayer,
    //             `M${node.x} ${node.y} L${nodes[edge].x} ${nodes[edge].y} Z`,
    //             lineColor,
    //             3,
    //             0.5
    //         );

    //         /*
    //         // Some sort of text drawing that shows the node connections of the line
    //         const dist = Math.sqrt(
    //             Math.pow(nodes[edge].x - node.x, 2) + Math.pow(nodes[edge].y - node.y, 2)
    //         );
    //         const dir = Math.atan2(nodes[edge].y - node.y, nodes[edge].x - node.x);
    //         // draw the text between the two connecting nodes and somehow also make the text not draw over already drawn text by using the direction to slightly offset the text closer to the node it started from
    //         // ctx.fillText(`N ${i}, E ${edge}`, node.x + (Math.cos(dir) * dist / 2) + 5 + (Math.cos(dir) === -1 || Math.cos(dir) === 1 ? 10 : 0), node.y + (Math.sin(dir) * dist / 2) + (Math.sin(dir) === 0 || Math.sin(dir) === -1 ? 10 : 0));
    //         */
    //     });
    // });

    walls.forEach((wall) => {
        createPath(
            svgDrawLayer,
            `M${wall.s.x} ${wall.s.y} L${wall.e.x} ${wall.e.y} Z`,
            'orange',
            size,
            0.5
        );
    });

    nodes.forEach((node, i) => {
        const fillColor = node.createdByRaycast ? 'red' : 'black';
        // const strokeColor = node?.raycast ? 'red' : 'green'; // TODO
        createCircle(svgDrawLayer, node.x, node.y, fillColor, size, 0.5);
        createText(svgDrawLayer, node.x - 1, node.y, `${i}`, 'grey', size, '', 0.5);
    });

    rays.forEach((ray, ri) => {
        // if (ray.hits.length > 0) console.log(ri, nodes.indexOf(ray.referenceNode), ray);
        let color = 'lightgrey';
        if (ray.hits.filter((h) => (h.object as LineSegment).s !== undefined).length > 0) {
            color = 'green';
        }

        // if (ray.hits.length > 1) {
        //     createCircle(
        //         svgDrawLayer,
        //         (ray.hits[0].object as NewNode).x || ray.hits[0].collisionPos.x,
        //         (ray.hits[0].object as NewNode).y || ray.hits[0].collisionPos.y,
        //         'skyblue',
        //         0.3,
        //         0.4
        //     );
        // }
        ray.hits.forEach((hit) => {
            // console.log(ri, hit);
            createCircle(
                svgDrawLayer,
                hit.collisionPos.x,
                hit.collisionPos.y,
                'purple',
                size / 2,
                0.5
            );
            // createText(
            //     svgDrawLayer,
            //     hit.collisionPos.x,
            //     hit.collisionPos.y - 1,
            //     'rn:' + nodes.indexOf(ray.referenceNode).toString(),
            //     'purple',
            //     1,
            //     '',
            //     0.3
            // );
        });

        createPath(
            svgDrawLayer,
            `M${ray.s.x} ${ray.s.y} L${ray.e.x} ${ray.e.y} Z`,
            color,
            color === 'lightgrey' ? size / 2 : size,
            color === 'lightgrey' ? 0.1 : 0.5
        );
        // createText(
        //     svgDrawLayer,
        //     (ray.s.x + ray.e.x) / 2,
        //     (ray.s.y + ray.e.y) / 2 + 1,
        //     'rn:' + nodes.indexOf(ray.referenceNode).toString() + '-ri:' + ri.toString(),
        //     color,
        //     1,
        //     '',
        //     0.5
        // );
    });

    // nodes.forEach((node, i) => {
    //     /*
    //     if (node.raycast) {
    //         ctx.fillStyle = 'black';
    //         ctx.fillText(
    //              // `${i} - [${node.x}, ${node.y}] : ${node.edges}`,
    //             `${i}`,
    //             node.x - 4, // + 10,
    //             node.y + 2 //
    //         );
    //         return;
    //     }
    //     */
    //     /* // Add createText to svg drawer
    //     ctx.fillStyle = 'white'; // "gray";
    //     // ctx.strokeText(i + ';' +node.x + ', ' + node.y + ':' + node.edges, 5 + node.x, 5+ node.y)
    //     ctx.fillText(
    //         // `${i} - [${node.x}, ${node.y}] : ${node.edges}`,
    //         `${i}`,
    //         node.x, //,
    //         node.y // - 10
    //     );
    //     */
    // });

    // try {
    //     const path = await AStar(22, 29, nodes);
    //     console.log(
    //         path.map((p, ppi) => {
    //             return { p: p, e: nodes[p].edges };
    //         })
    //     );

    //     path.forEach((i, ii) => {
    //         if (nodes[path[ii + 1]]) {
    //             const dPath = `M${nodes[i].x} ${nodes[i].y} L${nodes[path[ii + 1]].x} ${
    //                 nodes[path[ii + 1]].y
    //             } Z`;
    //             createPath(svgDrawLayer, dPath, 'lightblue', 2, 0.8);
    //         }

    //         createCircle(svgDrawLayer, nodes[i].x, nodes[i].y, 'lightblue', 2.5, 0.8);
    //     });

    //     const f = nodes[path[0]];
    //     const end = nodes[path[path.length - 1]];

    //     createCircle(svgDrawLayer, f.x, f.y, 'yellow', 5, 0.5);
    //     createCircle(svgDrawLayer, end.x, end.y, 'yellow', 5, 0.5);
    // } catch (e) {
    //     console.log(e);
    // }

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
    const perRenderEnd = performance.now();
    perRender.push(perRenderEnd - perRenderStart);
    createMes();
}
// @ts-ignore
window.render = render;

async function drawDatas(datas: { nodes: NewNode[]; walls: NewWall[]; data: HookData }[]) {
    // someday add steppy to this
    /*
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
    */
}

async function main() {
    const perRenderStart = performance.now();
    render();
    const perRenderFinish = performance.now();
    // console.log('render time: ', perRenderFinish - perRenderStart + 'ms');
    perRender.push(perRenderFinish - perRenderStart);
    createMes();
}

main();

// @ts-ignore
window.render = render;


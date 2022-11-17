import {
    Raycast,
    randomNodes,
    LineRay,
    NewNode,
    NewWall,
    Point,
    LineSegment,
    AStar,
    randomWalls,
} from '../../src/astar';

import {
    clearG,
    createCircle,
    createLayer,
    createLine,
    createPath,
    createText,
    deleteDraw,
    editItemById,
    itemExists,
} from '../svgEdit';

import * as _ from 'lodash';
//import eruda from "../eruda";

// @ts-ignore
import JsonViewer from 'json-viewer-js';

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
const width = 20;
const height = 20;
const amount = 50;
const genRandom: boolean = false;
const overrideRenderTimeout: number | null = null;
const size = 0.5;
const connections = 10;

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
    ? randomNodes({ amount, width, height, distance: 2, padding: 2 })
    : [
          //   { x: 5, y: 5, edges: { indexes: new Set<number>(), datas: [] } },
          //   { x: 10, y: 2, edges: { indexes: new Set<number>(), datas: [] } },
          //   { x: 20, y: 10, edges: { indexes: new Set<number>(), datas: [] } },
          //   { x: 2, y: 10, edges: { indexes: new Set<number>(), datas: [] } },
          //   { x: 20, y: 25, edges: { indexes: new Set<number>(), datas: [] } },
          //   { x: 30, y: 30, edges: { indexes: new Set<number>(), datas: [] } },
          //   { x: 7, y: 41, edges: { indexes: new Set<number>(), datas: [] } },

          //   { x: 0, y: 2, edges: { indexes: new Set([1]) } },
          //   { x: 1, y: 2, edges: { indexes: new Set([0, 2]) } },
          //   { x: 2, y: 2, edges: { indexes: new Set([1, 3]) } },
          //   { x: 3, y: 2, edges: { indexes: new Set([2, 4]) } },
          //   { x: 4, y: 2, edges: { indexes: new Set([3, 5]) } },
          //   { x: 5, y: 2, edges: { indexes: new Set([4]) } },
          { x: 1, y: 1, edges: { indexes: new Set() } },
          { x: 5, y: 6, edges: { indexes: new Set() } },
          { x: 10, y: 1, edges: { indexes: new Set() } },
      ];
let nodes: NewNode[] = _.cloneDeep(originalNodes);
// @ts-ignore
window.nodes = nodes;
let datas: any[] = [];
let walls: NewWall[] = genRandom
    ? randomWalls({ amount: amount / 2, width, height, length: width / 5, distance: 2 })
    : [
          //{ s: { x: 15, y: 0 }, e: { x: 15, y: 15 } },
          // { s: { x: 1, y: 17 }, e: { x: 12, y: 17 } },
          { s: { x: 5, y: 5 }, e: { x: 5, y: -5 } },
      ];
let rays: LineRay[] = [];

let debounce = false;
let renderDebounce = false;
// @ts-ignore
const pt = (drawSvg as SVGSVGElement).createSVGPoint(); // https://stackoverflow.com/a/42711775/13606260
let savePoint: Point | null = null;
let popWallsClicked = false;
drawSvg.addEventListener('mousemove', function (e) {
    const perUserDrawingStart = performance.now();
    if (debounce) return;
    debounce = true;

    pt.x = e.clientX;
    pt.y = e.clientY;

    // ====== https://stackoverflow.com/a/42711775/13606260
    // The cursor point, translated into svg coordinates
    // @ts-ignore
    var cursorpt = pt.matrixTransform(drawSvg.getScreenCTM()?.inverse());
    // ======

    const editF = editItemById(svgDrawLayer, 'cursor-follow', [
        {
            attr: 'x',
            value: cursorpt.x + 50 / width,
        },
        {
            attr: 'y',
            value: cursorpt.y + 50 / height,
        },
        {
            attr: 'text',
            value: `(${cursorpt.x.toFixed(2)}, ${cursorpt.y.toFixed(2)})`,
        },
    ]);

    if (editF === false) {
        createText(
            svgDrawLayer,
            cursorpt.x + 5,
            cursorpt.y + 5,
            `(${cursorpt.x.toFixed(2)}, ${cursorpt.y.toFixed(2)})`,
            'orange',
            2,
            '',
            0.5,
            'cursor-follow'
        );
    }

    if (savePoint !== null) {
        const editL = editItemById(svgDrawLayer, 'cursor-follow-line', [
            {
                attr: 'x2',
                value: cursorpt.x,
            },
            {
                attr: 'y2',
                value: cursorpt.y,
            },
        ]);

        if (editL === false) {
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
        }

        if (!popWallsClicked) {
            walls.pop();
        } else {
            popWallsClicked = false;
        }
        walls.push({ s: savePoint, e: { x: cursorpt.x, y: cursorpt.y } });
        if (!renderDebounce) {
            render().then(() => {
                renderDebounce = false;
            });
            // renderDebounce = true;
        }
        createMes();
        // setTimeout(() => {
        // renderDebounce = false;
        // render(false);
        // }, overrideRenderTimeout || 10 * (nodes.length * 0.5));
        // });
        // }
    }
    debounce = false;

    const perUserDrawingEnd = performance.now();
    perRenderDrawing.push(perUserDrawingEnd - perUserDrawingStart);
});

async function addDrawPoint(x: number, y: number) {
    if (x === undefined || y === undefined) {
        // @ts-ignore
        var cursorpt = pt.matrixTransform(drawSvg.getScreenCTM()?.inverse());
        x = cursorpt.x;
        y = cursorpt.y;
    }
    savePoint = { x: x, y: y };
    popWallsClicked = true;
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
    // @ts-ignore
    var cursorpt = pt.matrixTransform(drawSvg.getScreenCTM()?.inverse());

    if (savePoint?.x === cursorpt.x && savePoint?.y === cursorpt.y) {
    } else {
        walls.pop();
    }
    deleteDraw(svgDrawLayer, 'cursor-follow-line');
    savePoint = null;
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

async function render(reRaycast: boolean = true) {
    const perRenderStart = performance.now();
    clearG(svgDrawLayer);

    if (reRaycast) {
        if (nodes.length == 0) {
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
            const perRaycastStart = performance.now();
            let { nodes: n, rays: r } = await Raycast(_.cloneDeep(originalNodes), walls, {
                width: width,
                height: height,
                maxConnections: connections,
            });
            const perRaycastEnd = performance.now();
            perRaycast.push(perRaycastEnd - perRaycastStart);
            nodes = n;
            rays = r;
            // @ts-ignore
            // window.nodes = nodes;
        }
    }
    // console.log('after cast: ', performance.now() - perRenderStart);

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
        // if (ray.hits.filter((h) => (h.object as LineSegment).s !== undefined).length > 0) {
        //     color = 'green';
        // }

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
        // ray.hits.forEach((hit) => {
        //     // console.log(ri, hit);
        //     createCircle(
        //         svgDrawLayer,
        //         hit.collisionPos.x,
        //         hit.collisionPos.y,
        //         'purple',
        //         size / 2.5,
        //         0.5
        //     );
        //     // createText(
        //     //     svgDrawLayer,
        //     //     hit.collisionPos.x,
        //     //     hit.collisionPos.y - 1,
        //     //     'rn:' + nodes.indexOf(ray.referenceNode).toString(),
        //     //     'purple',
        //     //     1,
        //     //     '',
        //     //     0.3
        //     // );
        // });

        createPath(
            svgDrawLayer,
            `M${ray.s.x} ${ray.s.y} L${ray.e.x} ${ray.e.y} Z`,
            color,
            color === 'lightgrey' ? 0.5 : 0.5,
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

    try {
        const path = await AStar(0, 2, nodes);
        // console.log(
        //     path.map((p, ppi) => {
        //         return { p: p, e: nodes[p].edges.indexes };
        //     })
        // );
        console.log(path);

        path.forEach((i, ii) => {
            if (nodes[path[ii + 1]]) {
                const dPath = `M${nodes[i].x} ${nodes[i].y} L${nodes[path[ii + 1]].x} ${
                    nodes[path[ii + 1]].y
                } Z`;
                createPath(svgDrawLayer, dPath, 'lightblue', size / 2, 0.8);
            }

            createCircle(svgDrawLayer, nodes[i].x, nodes[i].y, 'lightblue', size / 2, 0.8);
        });

        const f = nodes[path[0]];
        const end = nodes[path[path.length - 1]];

        createCircle(svgDrawLayer, f.x, f.y, 'yellow', size / 1.5, 0.5);
        createCircle(svgDrawLayer, end.x, end.y, 'yellow', size / 1.5, 0.5);
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
    // (document.getElementById('data') as HTMLDivElement).innerHTML = '';
    // new JsonViewer({
    //     container: document.getElementById('data'),
    //     data: JSON.stringify(nodes, (key, value) => {
    //         // fix the problem where entries is blank. cause this lib doesnt know how to convert a set to an array
    //         return value instanceof Set ? [...value] : value;
    //     }),
    //     theme: 'dark',
    //     expand: false,
    // });
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


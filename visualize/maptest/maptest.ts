import {
    Raycast,
    svgToPaths,
    generateNodes,
    generateWalls,
    Node,
    AStar,
    HookData,
    HookDataType,
    NewNode,
    NewWall,
} from '../../src/astar';
import { Line } from '../../src/col';
import { defaultFilterFunction } from '../../src/generateNodesFromSVG';
import { clearG, createCircle, createLayer, createLine, createPath, createText } from '../svgEdit';
//import eruda from "../eruda";

// @ts-ignore
import _dt from 'bundle-text:./BHS_Building_Map_SVG.svg';

// @ts-ignore
import JsonViewer from 'json-viewer-js';

function createElement(str: string): Element | null {
    const temp = document.createElement('template');
    str = str.trim();
    temp.innerHTML = str;
    return temp.content.firstElementChild;
}

const map_svg = createElement(_dt) as SVGSVGElement;
if (map_svg === null) {
    throw new Error('map_svg is null');
}

map_svg.id = 'map-svg';
map_svg.setAttribute('width', '100%');
map_svg.setAttribute('height', '');
document.body.replaceChild(map_svg, document.getElementById('map-svg') as Element);
// document.getElementById('pathfinding').style.display = 'inline'; // Show the pathfinding drawings

const svgDrawLayer = createLayer(map_svg, 'svg-draw-layer', true);

// Display options
let highlightWalls = false;
let showText = false;
let makePath = [1, 4];

const highlightWallsButton = document.getElementById('highlight-walls-btn');
const showTextButton = document.getElementById('show-text-btn');
if (highlightWallsButton) {
    highlightWallsButton.innerText = highlightWalls ? 'Hide Walls' : 'Show Walls';

    highlightWallsButton.addEventListener('click', () => {
        highlightWalls = !highlightWalls;
        highlightWallsButton.innerText = highlightWalls ? 'Hide Walls' : 'Show Walls';
        render(true);
    });
}
if (showTextButton) {
    showTextButton.innerText = showText ? 'Hide Text' : 'Show Text';

    showTextButton.addEventListener('click', () => {
        showText = !showText;
        showTextButton.innerText = showText ? 'Hide Text' : 'Show Text';
        render(true);
    });
}

// For the raycast
let datas: any[] = [];
let walls: NewWall[] = [];
let nodes: NewNode[] = [];

let debounce = false;

const pt = (map_svg as SVGSVGElement).createSVGPoint(); // https://stackoverflow.com/a/42711775/13606260

map_svg.addEventListener('click', function (e) {
    pt.x = e.clientX;
    pt.y = e.clientY;

    // ====== https://stackoverflow.com/a/42711775/13606260
    // The cursor point, translated into svg coordinates
    var cursorpt = pt.matrixTransform(map_svg.getScreenCTM()?.inverse());
    // console.log('(' + cursorpt.x + ', ' + cursorpt.y + ')');
    // ====== End
    createCircle(svgDrawLayer, cursorpt.x, cursorpt.y, 'purple', 2.5, 0.5);
    // nodes.push();

    render(true, {
        x: +cursorpt.x.toFixed(),
        y: +cursorpt.y.toFixed(),
        edges: {
            indexes: new Set<number>(),
            datas: [],
        },
    }).then(() => {
        debounce = false;
    });
});

function raycastHook(nodes: Node[], walls: Line[], data: HookData) {
    /*
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
    */
}

async function render(reRaycast: boolean = true, pushNode?: NewNode) {
    clearG(svgDrawLayer);

    if (reRaycast) {
        if (nodes.length == 0 || walls.length == 0) {
            const svgPaths = await svgToPaths(_dt, defaultFilterFunction);

            walls = await generateWalls(svgPaths);

            const { nodes: n, rays: r } = await Raycast(await generateNodes(svgPaths), walls, {
                width: 1920,
                height: 1080,
            });
            nodes = n;
            // console.log(n);
        } else {
            datas = [];
            const svgPaths = await svgToPaths(_dt, defaultFilterFunction);
            const p = await generateNodes(svgPaths);
            if (pushNode) p.push(pushNode);
            const { nodes: n, rays: r } = await Raycast(p, walls, {
                width: 1920,
                height: 1080,
            });
            nodes = n;
            // console.log(n);
        }
    }

    // console.log("Nodes: ", nodes);
    // console.log("Walls: ", walls);
    if (highlightWalls) {
        walls.forEach((wall) => {
            createPath(
                svgDrawLayer,
                `M${wall.s.x} ${wall.s.y} L${wall.e.x} ${wall.e.y} Z`,
                'orange',
                2
            );
        });
    }

    nodes.forEach((node, i) => {
        node.edges.indexes.forEach((edge) => {
            const lineColor = nodes[edge].createdByRaycast ? 'red' : 'green';
            createPath(
                svgDrawLayer,
                `M${node.x} ${node.y} L${nodes[edge].x} ${nodes[edge].y} Z`,
                lineColor,
                3,
                0.5
            );

            /*
            // Some sort of text drawing that shows the node connections of the line
            const dist = Math.sqrt(
                Math.pow(nodes[edge].x - node.x, 2) + Math.pow(nodes[edge].y - node.y, 2)
            );
            const dir = Math.atan2(nodes[edge].y - node.y, nodes[edge].x - node.x);
            // draw the text between the two connecting nodes and somehow also make the text not draw over already drawn text by using the direction to slightly offset the text closer to the node it started from
            // ctx.fillText(`N ${i}, E ${edge}`, node.x + (Math.cos(dir) * dist / 2) + 5 + (Math.cos(dir) === -1 || Math.cos(dir) === 1 ? 10 : 0), node.y + (Math.sin(dir) * dist / 2) + (Math.sin(dir) === 0 || Math.sin(dir) === -1 ? 10 : 0));
            */
        });
    });

    nodes.forEach((node, i) => {
        const fillColor = node.createdByRaycast ? 'red' : 'green';
        // const strokeColor = node?.raycast ? 'red' : 'green'; // TODO
        createCircle(svgDrawLayer, node.x, node.y, fillColor, 2.5);
        createText(svgDrawLayer, node.x, node.y, `${i}`, 'white', 10);
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
        /* // Add createText to svg drawer
        ctx.fillStyle = 'white'; // "gray";
        // ctx.strokeText(i + ';' +node.x + ', ' + node.y + ':' + node.edges, 5 + node.x, 5+ node.y)
        ctx.fillText(
            // `${i} - [${node.x}, ${node.y}] : ${node.edges}`,
            `${i}`,
            node.x, //,
            node.y // - 10
        );
        */
    });

    try {
        const path = await AStar(22, 29, nodes);
        // console.log(
        //     path.map((p, ppi) => {
        //         return { p: p, e: nodes[p].edges };
        //     })
        // );
        console.log(path);

        path.forEach((i, ii) => {
            if (nodes[path[ii + 1]]) {
                const dPath = `M${nodes[i].x} ${nodes[i].y} L${nodes[path[ii + 1]].x} ${
                    nodes[path[ii + 1]].y
                } Z`;
                createPath(svgDrawLayer, dPath, 'lightblue', 2, 0.8);
            }

            createCircle(svgDrawLayer, nodes[i].x, nodes[i].y, 'lightblue', 2.5, 0.8);
        });

        const f = nodes[path[0]];
        const end = nodes[path[path.length - 1]];

        createCircle(svgDrawLayer, f.x, f.y, 'yellow', 5, 0.5);
        createCircle(svgDrawLayer, end.x, end.y, 'yellow', 5, 0.5);
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
    render();
}

main();

import { Raycast, svgToPaths, generateNodes, generateWalls, Node, AStar } from "../../src/astar";

// @ts-ignore
import _dt from "bundle-text:./map.svg";

const _d = 'data:image.svg+xml;base64,' + atob(_dt);
// @ts-ignore
//import _d from "data-url:./map.svg"; // might be a good idea to do a url and not bundle it in

// having two imports means that the map svg is included twice in the bundle, maybe convert from text to data url?
const d: string = _d;
// can you import the file or like uh .. how to get svg as string ???
//import eruda from "../eruda";


// Silly mobile
const dpi = window.devicePixelRatio <= 2.84 ? window.devicePixelRatio : 2.84;

const w = 1920;
const h = 1080;
const padding = 42;

const canva = document.getElementsByTagName("canvas")[0];
if (!canva) {
    throw new Error("of");
}

const img = new Image();
canva.id = "display";
canva.width = w*dpi;
canva.height = h*dpi;
console.log(w*dpi*h*dpi);
canva.style.width = "100%";
//canva.style.height = "";
const ctx = canva.getContext("2d");
ctx?.scale(dpi, dpi);

let walls: { sx: number, sy: number, ex: number, ey: number }[] = [];
let nodes: Node[] = [];

let debounce = false;
canva.addEventListener(
    "click",
    function (e) {
        if (debounce) return;
        debounce = true;

        var rect = canva.getBoundingClientRect();
        var x = ((e.clientX  - rect.left) / (rect.right - rect.left) * canva.width);
        var y = ((e.clientY  - rect.top) / (rect.bottom  - rect.top) * canva.height);

        if (e.shiftKey) {
            walls.push({sx: (x/dpi)-10, sy: (y/dpi)-10, ex: (x/dpi)+10, ey: (y/dpi)-10});
            render().then(() => {debounce = false});
            return;
        }

        if (ctx === null) {
            console.log("click, but ctx is null");
            return;
        }

        // var rect = canva.getBoundingClientRect();
        // var x = ((e.clientX  - rect.left) / (rect.right - rect.left) * canva.width);
        // var y = ((e.clientY  - rect.top) / (rect.bottom  - rect.top) * canva.height);

        // console.log(x, y)
        nodes.push({ x: x/dpi, y: y/dpi, edges: [] });

        render().then(() => {debounce = false});
    },
    false
);

async function render() {
    if (ctx === null) return;
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0);

    if (nodes.length == 0 || walls.length == 0) {
        const svgPaths = await svgToPaths(_dt, {
            walls: ["#000000"],
            walkable: ["#ffffff"]
        });

        walls = await generateWalls(svgPaths);

        nodes = await Raycast(
            await generateNodes(svgPaths),
            [],
            walls,
        );
    } else {
        nodes = await Raycast(
            nodes,
            [],
            walls,
        );
    }

    //console.log("Nodes: ", nodes);
    //console.log("Walls: ", walls);

    nodes.forEach((node, i) => {
        ctx.moveTo(node.x, node.y);
        node.edges.forEach((edge) => {
            ctx.strokeStyle = node?.raycast ? "red" : "green";
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodes[edge].x, nodes[edge].y);
            ctx.stroke();
        });
    });
    
    nodes.forEach((node, i) => {
        ctx.fillStyle = node?.raycast ? "red" : "green";
        ctx.strokeStyle = node?.raycast ? "red" : "green";
        const [nx, ny] = [node.x, node.y];
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
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

        ctx.fillStyle = 'black';// "gray";
        // ctx.strokeText(i + ';' +node.x + ', ' + node.y + ':' + node.edges, 5 + node.x, 5+ node.y)
        ctx.fillText(
            /* `${i} - [${node.x}, ${node.y}] : ${node.edges}`, */
            `${i}`,
            node.x, //,
            node.y, // - 10
        );
    });

    walls.forEach((wall) => {
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.moveTo(wall.sx, wall.sy);
        ctx.lineTo(wall.ex, wall.ey);
        ctx.stroke();
    });

    const path = await AStar(1, 0, nodes);
    console.log(path)
    const f = nodes[path[0]]
    const end = nodes[path[path.length - 1]]
    ctx.strokeStyle = "yellow"
    ctx.fillStyle = "yellow"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(f.x, f.y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.moveTo(end.x, end.y)
    ctx.arc(end.x, end.y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.moveTo(f.x, f.y)
    ctx.stroke()
    path.forEach((i) => {
        ctx.lineTo(nodes[i].x, nodes[i].y)
    })
    ctx.stroke()
    ctx.lineWidth = 1;
}

async function main() {
    img.onload = function () {
        render();
    };
    img.src = _d;
}

main()

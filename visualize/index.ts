import { randomNodes, AStar, Raycast } from "../src/astar";
//import { createGzip } from "zlib";
const params = new URLSearchParams(window.location.search)
function intParam(name: string, defaul: number): number {
    const o = params.get(name);
    if (o == null) {
        return defaul
    }
    else {
        return parseInt(o)
    }
}

const amt = intParam("amt", 128)
const count = intParam("count", 5000)
const w = intParam("w", 800)
const h = intParam("h",800)

const conAmt = 1;
const padding = 32;
const ele = document.getElementById("mes")
const timeNodes: number[] = []
const rayTimes: number[] = [];
let failedRuns = 0;
const timePathfind: number[] = []
const average = (array: number[]) => array.reduce((a, b) => a + b) / array.length;
let z: NodeJS.Timeout;
const extraNodes: number[] = []
const pathLengths: number[] = [];
function createMes() {
    let msg = amt + " nodes; "
    msg += "randomNodes: " + average(timeNodes).toFixed(5) + "ms; "
    msg += "raycast: " + average(rayTimes).toFixed(5) + "ms; "
    msg += "pathfind: " + average(timePathfind).toFixed(5) + "ms; "
    msg += "extra nodes: " + average(extraNodes).toFixed(5) + "; "
    msg += "averagePathLength: " + average(pathLengths).toFixed(5) + "; "
    msg += "runs: " + Math.floor(average([timeNodes.length, timePathfind.length])) + "/" + count + " f:" + failedRuns + ";";
    return msg
}

const canva = document.getElementsByTagName("canvas")[0];
if (!canva) {
    throw new Error("of")
}
canva.id = "cring"
canva.width = w+(padding*2);
canva.height = h+(padding*2);
//alert("canvas created")

const ctx = canva.getContext("2d")

async function doOP() {
    if (!ctx) {
        alert("unable to establish canvas context!")
        throw new Error("Cnva")
    }
    //alert("canvas context")
    const scale: (x: number, y: number) => [number, number] = (x, y) => { return [((x / amt) * w)+padding, ((y / amt) * h)+padding] }
    //a("adding child")
    //alert("nodes")
    const t1 = performance.now()
    const _nodes = await randomNodes(amt, conAmt)
    const t2 = performance.now()
    const _nodes2 = _nodes.map((r) => { return { ...r, edges: [] } })

    const t6 = performance.now()
    const nodes = await Raycast(_nodes2)
    const t7 = performance.now()
    ctx.clearRect(0,0,canva.width,canva.height)
    //alert("nodesDone")
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1
    //alert(nodes.length)
    nodes.forEach((node, i) => {
        ctx.moveTo(...scale(node.x, node.y))
        ctx.strokeStyle="red";
        node.edges.forEach((edge) => {
            ctx.beginPath()
            ctx.moveTo(...scale(node.x, node.y))
            ctx.lineTo(...scale(nodes[edge].x, nodes[edge].y))
            ctx.stroke()
        })
    })
    nodes.forEach((node,i)=>{
        const [nx, ny] = scale(node.x, node.y)
        if (i >= amt) {
            ctx.strokeStyle = "blue"
            ctx.fillStyle = "blue"
        } else {
            ctx.strokeStyle = "green"
            ctx.fillStyle = "green"
        }
        ctx.beginPath()
        ctx.arc(nx, ny, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
    })
    const t3 = performance.now()
    const path = await AStar(Math.floor(Math.random() * amt), Math.floor(Math.random() * amt), nodes)
    const t4 = performance.now()
    timePathfind.push(t4 - t3)
    timeNodes.push(t2 - t1)
    pathLengths.push(path.length)
    rayTimes.push(t7 - t6)
    extraNodes.push(nodes.length - amt);
    const f = nodes[path[0]]
    const end = nodes[path[path.length - 1]]
    ctx.strokeStyle = "lightblue"
    ctx.fillStyle = "lightblue"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(scale(f.x, f.y)[0], scale(f.x, f.y)[1], 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.moveTo(...scale(end.x, end.y))
    ctx.arc(scale(end.x, end.y)[0], scale(end.x, end.y)[1], 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.moveTo(...scale(f.x, f.y))
    ctx.stroke()
    path.forEach((i) => {
        ctx.lineTo(...scale(nodes[i].x, nodes[i].y))
    })
    ctx.stroke()
    if (ele != undefined) {
        ele.innerText = createMes()
    }
}

function settings() {
    const s = document.getElementById("settings")
    if (!s) {
        return;
    }
    s.innerHTML = "Settings: <br />"
    s.innerHTML += "slow: "+speed+";<br />"
    s.innerHTML += "w: "+w+";<br />"
    s.innerHTML += "h: "+h+";<br />"
    s.innerHTML += "amt: "+amt+";<br />"
    s.innerHTML += "<br />colors:<br />"
    s.innerHTML += "green: random node;<br />"
    s.innerHTML += "blue: node added by raycast;<br />"
    s.innerHTML += "red line: node edge;<br />"
    s.innerHTML += "light blue line: pathfound path;<br />"
    s.innerHTML += "light blue: start/end;<br />"
}
const speed = params.get("slow") != null;
async function main() {
    settings()
    while (true) {
        await doOP();
        if (timePathfind.length == count) {
        break;
        } 
        await new Promise((r) => { setTimeout(r, speed ? 5000 : 1) })
    }
    
}
main()


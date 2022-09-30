import type { Node } from "./astar";
//mport { svgNodesRaycast } from "./generateNodesFromPathImage";
//mport { svgNodesRaycast } from "./generateNodesFromPathImage";

/*enum GID {
    EMPTY,
    NODE,
    PATH,
    WALL
}
type GridNode = {
    id: GID,
    ref?: any;
}*/

export type Line = {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
};
/*
export function Raycast(inp: Node[], walls?: Line[]): Node[] {
    if (walls === undefined) {
        walls = [];
    }
    inp.forEach((node, i) => {
        //console.log(node.x,node.y)
        if (node.x != Math.floor(node.x) || node.y != Math.floor(node.y)) {
            console.warn("Decimal values are not supported in raycast and will be ignored")
        }
        inp[i].ox = node.x;
        inp[i].oy = node.y;
        inp[i].x = Math.floor(node.x);
        inp[i].y = Math.floor(node.y);
    })
    const sw = Math.abs(Math.min(...[...inp,...walls].map((r) => r.x)))
    const w = Math.max(...[...inp,...walls].map((r) => r.x)) + 1 + sw
    const sh = Math.abs(Math.min(...[...inp,...walls].map((r) => r.y)))
    const h = Math.max(...[...inp,...walls].map((r) => r.y))+1+sh
    //console.log(w,h,sw,sh)
    //console.log(w,h)
    const matrix: GridNode[][] = Array.from({length: h}, () => Array.from({length:w},() => {return {id:GID.EMPTY}} ))
    walls.forEach(element => {
        const ydistance = element.sy - element.ey;
        const xdistance = element.sx - element.ex;
        for (let i =0; i < Math.abs(ydistance); i++) {
            // this assumes the wall is vertical and the has no slope (no change in x)
            matrix[(ydistance < 0 ? element.sy + i : element.sy - i)+sh][element.sx+sw] = {id:GID.WALL}
            // const ii = walls.push({ x: w.sx, y: distance < 0 ? w.sy + i : w.sy - i });
        }
    });
    inp.forEach((node, i) => {
        //console.log(node.x,node.y)
        matrix[node.y+sh][node.x+sw] = {id: GID.NODE, ref: i}
    })
    
    const directions = [
        [0,1], //down
        [0,-1],//up
        [1,0],//right
        [-1,0]//left
    ]
    inp.forEach((node, i) => {
        if (node.raycast === true) return;
        directions.forEach((dir) => {
            const tracker = {...node, x: node.x+sw, y: node.y+sh }
            //console.log(dir)
            outer: while (true) {
                tracker.x += dir[0]
                tracker.y += dir[1]
                if (tracker.x < 0 || tracker.x >= w || tracker.y < 0 || tracker.y >= h) {
                    //console.log(tracker.x, tracker.y, "left graph")
                    break;
                }
                const d = matrix[tracker.y][tracker.x]
                if (d == undefined) {
                    console.warn("matrix was undefined, this should probably not happen")
                    break;
                }
                switch (d.id) {
                    case GID.EMPTY:
                        matrix[tracker.y][tracker.x] = { id: GID.PATH, ref: i }
                        break;
                    case GID.NODE:
                        //console.log(i,"form connection to node",d.ref)
                        if (inp[i].edges.includes(d.ref)) {
                            break outer;
                        }
                        inp[d.ref].edges.push(i)
                        inp[i].edges.push(d.ref)
                        break outer;
                    case GID.PATH:
                        if (inp[i].edges.includes(d.ref)) {
                            //console.log("link already formed: ",i,"&",d.ref)
                            break outer;
                        }
                        //console.log("create node at ",tracker.x,tracker.y, " and connect it with ",i,"&",d.ref)

                        const thisNode = inp[i]
                        const collideNode = inp[d.ref]
                        const dx = ((thisNode?.dx || 0) > 0) ? (thisNode?.dx || 0) : (collideNode?.dx || 0);
                        const dy = ((thisNode?.dy || 0) > 0) ? (thisNode?.dy || 0) : (collideNode?.dy || 0);

                        const ne = inp.push({x:(tracker.x-sw)+dx, y:(tracker.y-sh)+dy, raycast:true, edges: [i,d.ref]})-1
                        inp[i].edges.push(ne)
                        inp[d.ref].edges.push(ne)
                        break outer;
                    case GID.WALL:
                        break outer;
            }
        }
        })
    })
    //console.log(inp)
    //console.log(matrix)
    return inp.map((node) => {
        return {...node, x: node.ox || node.x, y: node.oy || node.y}
    })
}
*/

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): false | { x: number; y: number } {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return false;
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return { x, y };
}

export function LLI(l1: Line, l2: Line) {
  return intersect(l1.sx, l1.sy, l1.ex, l1.ey, l2.sx, l2.sy, l2.ex, l2.ey);
}
function fastDist(x1: number, y1: number, x2: number, y2: number) {
  return Math.abs(x2-x1)+Math.abs(y2-y1)
}
function pointLineDist(x: number, y: number, l: Line) {
  const ax1 = l.sx;
  const ay1 = l.sy;
  const ax2 = l.ex;
  const ay2 = l.ey;
  return (
    (x * (ay2 - ay1) - y * (ax2 - ax1) + ax2 * ay1 - ay2 * ax1) /
    Math.sqrt(((ay2 - ay1) ^ 2) + ((ax2 - ax1) ^ 2))
  );
}

function nodeConnectionStyle(
  indl: number,
  colLines: { l: Line; ref: number }[],
  l: { l: Line; ref: number },
  col: boolean | { x: number; y: number },
  nodes: Node[],
  dpointLine: Line,
  enable: (number | string)[]
) {
  if (enable.length === 0) {
    console.log("Did you mean to leave the node connection style as none?");
    return colLines;
  }
  if (enable.includes(1) || enable.includes("splice")) colLines.splice(indl, 1);
  if (col === false) return colLines;
  if (col === true) {
    console.log(
      "col returned true in nodeConnectionStyle: This should not happen. EVER"
    );
    return colLines;
  }
  if (enable.includes(2) || enable.includes("l"))
    colLines.push({
      l: { ...l.l, ex: col.x, ey: col.y },
      ref: nodes.length - 1,
    });
  if (enable.includes(3) || enable.includes("dpoint"))
    colLines.push({
      l: { ...dpointLine, ex: col.x, ey: col.y },
      ref: nodes.length - 1,
    });
  return colLines;
}

function reduceEnd(line: Line, r: number) {
  var dx = line.ex - line.sx;
  var dy = line.ey - line.sy;
  var mag = Math.hypot(dx, dy);
  return {
    x: line.ex - (r * dx) / mag,
    y: line.ey - (r * dy) / mag,
  };
}

export function Raycast(nodes: Node[], walls: Line[], margin?: number) {

}

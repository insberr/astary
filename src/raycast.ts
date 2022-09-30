import type { Node } from "./astar"
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
    sx: number,
    sy: number
    ex: number,
    ey: number
}
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
function intersect(x1: number , y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): false | {x: number, y: number} {

    // Check if none of the lines are of length 0
      if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
          return false
      }
  
      const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
  
    // Lines are parallel
      if (denominator === 0) {
          return false
      }
  
      let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
      let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator
  
    // is the intersection along the segments
      if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
          return false
      }
  
    // Return a object with the x and y coordinates of the intersection
      let x = x1 + ua * (x2 - x1)
      let y = y1 + ua * (y2 - y1)

      return {x,y}
    }

function LLI(l1: Line, l2: Line) {
    return intersect(l1.sx,l1.sy,l1.ex,l1.ey,l2.sx,l2.sy,l2.ex,l2.ey)
}
function fastDist(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x2-x1)+Math.abs(y1-y2)
}
function pointLineDist(x: number, y: number, l: Line) {
    const ax1 = l.sx;
    const ay1 = l.sy;
    const ax2 = l.ex;
    const ay2 = l.ey;
    return ((x * (ay2 - ay1)) - (y * (ax2 - ax1)) + (ax2 * ay1) - (ay2 * ax1)) / Math.sqrt(((ay2 - ay1) ^ 2) + ((ax2 - ax1) ^ 2));
}

function nodeConnectionStyle(indl: number, colLines: {l: Line, ref: number}[], l: { l: Line, ref: number }, col: boolean | { x: number, y: number }, nodes: Node[], dpointLine: Line, enable: (number|string)[]) {
    if (enable.length === 0) { console.log('Did you mean to leave the node connection style as none?'); return colLines; }
    if (enable.includes(1) || enable.includes('splice')) colLines.splice(indl,1)
    if (col === false) return colLines;
    if (col === true) { console.log('col returned true in nodeConnectionStyle: This should not happen. EVER'); return colLines; }
    if (enable.includes(2) || enable.includes('l')) colLines.push({l: {...l.l, ex: col.x, ey: col.y}, ref: nodes.length-1})
    if (enable.includes(3) || enable.includes('dpoint')) colLines.push({l: {...dpointLine, ex: col.x, ey: col.y}, ref: nodes.length-1})
    return colLines;
}

export function Raycast(nodes: Node[], style: (string|number)[], _walls?: Line[]): Node[] {
    let walls: Line[] = []
    const extraNodes: Node[] = [];
    if (_walls != undefined) {
        walls = _walls
    }
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    walls.forEach((w) => {
        xs.push(w.ex,w.sx)
        ys.push(w.ey,w.sy)
    })

    const minX = Math.min.apply(null,xs)
    const maxX = Math.max.apply(null,xs)
    const minY = Math.min.apply(null,ys)
    const maxY = Math.max.apply(null,ys)
    const colLines: {l: Line, ref: number}[] = []
    nodes.forEach((node,i) => {
        if (node.raycast) {
            return;
        }
        // edges of the map
        const mapEdges = [
            {x: node.x, y: minY },
            {x: node.x, y: maxY },
            {x: minX, y: node.y },
            {x: maxX, y: node.y }
        ]
        // filters to find points on raycasted line.
        const dirFilters: ((x:number,y:number)=>boolean)[] = [
            /* up    */ (x,y) => node.x == x && y > node.y,
            /* right */ (x,y) => node.y == y && x > node.x,
            /* down  */ (x,y) => node.x == x && y < node.y,
            /* left. */ (x,y) => node.y == y && x < node.x
        ]
        dirFilters.forEach(dirf => {
            function after(dPoint: {x:number, y:number}, isWall?: boolean) { // pls replace with something better.
                // construct a line between us and the dPoint
                const dpointLine = {sx: node.x, sy: node.y, ex: dPoint.x, ey: dPoint.y}
                const dplWallCol = walls.filter((w) => LLI(dpointLine,w))
                if (dplWallCol.length > 0) {
                    dplWallCol.forEach((w) => {
                        const col = LLI(dpointLine,w);
                        if (col === false) {
                            throw new Error("This should never happen")
                        }
                        colLines.push({l: { ...dpointLine, ex: col.x, ey: col.y }, ref: i})
                    })
                    return;
                }
                // 0 length lines are cringe
                if (dpointLine.sx == dpointLine.ex && dpointLine.sy == dpointLine.ey) {
                    return
                }
                //let distanceToCollision: number | null = 0;
                //let distancesToWalls = 0;
                //let wallBlocks: boolean[] = [];
                //console.log("line",dpointLine)
                for (const l of colLines) {
                    const indl = colLines.indexOf(l)
                    // do we colide with this line?
                    const col = LLI(dpointLine,l.l)
                    
                    /*
                    if (col !== false) {
                        distanceToCollision = fastDist(node.x, node.y, (col as {x:number,y:number}).x, (col as {x:number,y:number}).y)
                        //cosnt
                        const wallCollision = LLI(l.l, walls.filter((w) => LLI(l.l,w))[0])
                        if (wallCollision !== false) distancesToWalls = fastDist(node.x, node.y, wallCollision.x, wallCollision.y)

                        console.log(distanceToCollision, distancesToWalls)
                        if (distanceToCollision > distancesToWalls) {
                            console.log('wall first')
                        }
                    } else {
                        distanceToCollision = null;
                    }
                    */

                    
                    
                    /*
                    // does this line collide with a wall?
                    const wallCol = walls.filter(w => LLI(dpointLine,w))
                    if (wallCol.length > 0) {
                        const nearestWall = wallCol.sort((a, b) => {
                            const x = dpointLine.sx;
                            const y = dpointLine.sy;
        
                            const ax1 = a.sx;
                            const ay1 = a.sy;
                            const ax2 = a.ex;
                            const ay2 = a.ey;
        
                            const bx1 = b.sx;
                            const by1 = b.sy;
                            const bx2 = b.ex;
                            const by2 = b.ey;
        
                            var adist = Math.abs(((x * (ay2 - ay1)) - (y * (ax2 - ax1)) + (ax2 * ay1) - (ay2 * ax1))) / Math.sqrt(((ay2 - ay1) ^ 2) + ((ax2 - ax1) ^ 2));
                            var bdist = Math.abs(((x * (by2 - by1)) - (y * (bx2 - bx1)) + (bx2 * by1) - (by2 * bx1))) / Math.sqrt(((by2 - by1) ^ 2) + ((bx2 - bx1) ^ 2));
                            return adist - bdist;
                        })[0]

                        //distanceToCollision = fastDist(node.x, node.y, (col as {x:number,y:number}).x, (col as {x:number,y:number}).y)
                        //distancesToWalls.push(pointLineDist(node.x, node.y, nearestWall));
                    }
                    
                    if (col !== false) {
                        distanceToCollision = fastDist(node.x, node.y, (col as {x:number,y:number}).x, (col as {x:number,y:number}).y)
                    } else {
                        distanceToCollision = null;
                    }
                    wallCol.forEach(wc => {
                        distancesToWalls.push(pointLineDist(node.x, node.y, wc));
                    })

                    wallBlocks = distancesToWalls.map(d => {
                        if (distanceToCollision == null) return false;
                        if (d > distanceToCollision) {
                            return true;
                        }
                        return false;
                    })

                    if (distanceToCollision !== null && wallBlocks.filter(b => b === true).length > 0) {
                        //wallBlocks = []
                        distancesToWalls = []
                        //return;
                    }
                    */

                    if (l.ref == i) {
                        continue;
                    }

                    // distence to nearest wall, distance to collison
                    // is the wall before the collision

                    //console.log(l.ref,i,col)
                    if (col) {
                        //console.log("collision",l.ref,i)
                        if (nodes[i].edges.includes(l.ref)) {
                            return;
                        }
                        // connect them with a 3rd
                        if (isWall === undefined || !isWall) {
                            nodes.push({x: col.x, y: col.y, raycast: true, edges: [i,l.ref]})
                            nodes[i].edges.push(nodes.length-1)
                            nodes[l.ref].edges.push(nodes.length-1)
                        }
                        
                        // mix and match the next 3 lines for different results
                        // colLines.splice(indl,1)
                        // colLines.push({l: {...l.l, ex: col.x, ey: col.y}, ref: nodes.length-1})
                        // colLines.push({l: {...dpointLine, ex: col.x, ey: col.y}, ref: nodes.length-1})
                        nodeConnectionStyle(indl, colLines, l, col, nodes, dpointLine, style)
                        // i have no ideal
                        return
                        
                    }
                }
                // add the dpointline.
                if (isWall === undefined || !isWall) colLines.push({l:dpointLine, ref: i})
            }
            const nodesOnLine = nodes.filter((n) => dirf(n.x,n.y))

            if (nodesOnLine.length == 0) {
                // try to find an edge to create a line to
                const ff = mapEdges.find((p) => {
                    //console.log("point",p,"dirf",dirf(p.x,p.y),"node",node,)
                    return dirf(p.x,p.y)
                })
                //console.log(ff)
                if (!ff) {
                    // node is on the edge
                    return;
                }
                after(ff) // gamer
                return;
            }
            let con: Node
            if (nodes.length > 1) {
                // find the closest node on line
                con = nodesOnLine.reduce((p, n) => fastDist(p.x,p.y,node.x,node.y) > fastDist(n.x,n.y,node.x,node.y) ? n : p)
            } else {
                // only 1 node, dont need to find it.
                con = nodesOnLine[0]
            }
            // construct a line between this node and the dest node
            const ln: Line = {
                sx: node.x,
                sy: node.y,
                ex: con.x,
                ey: con.y
            }
            // find all the walls that intersect with our line
            var blocked = walls.filter((w) => LLI(ln,w))
            if (blocked.length > 0) {
                blocked = blocked.sort((a, b) => {
                    const x = ln.sx;
                    const y = ln.sy;

                    const ax1 = a.sx;
                    const ay1 = a.sy;
                    const ax2 = a.ex;
                    const ay2 = a.ey;

                    const bx1 = b.sx;
                    const by1 = b.sy;
                    const bx2 = b.ex;
                    const by2 = b.ey;

                    var adist = Math.abs(((x * (ay2 - ay1)) - (y * (ax2 - ax1)) + (ax2 * ay1) - (ay2 * ax1))) / Math.sqrt(((ay2 - ay1) ^ 2) + ((ax2 - ax1) ^ 2));
                    var bdist = Math.abs(((x * (by2 - by1)) - (y * (bx2 - bx1)) + (bx2 * by1) - (by2 * bx1))) / Math.sqrt(((by2 - by1) ^ 2) + ((bx2 - bx1) ^ 2));
                    return adist - bdist;
                })
            }
            if (blocked !== undefined && blocked.length>0) {
                //console.log("ln: ", ln, " Blocked: ", blocked)
                //console.log(blocked)
                //console.log("WALL")
                // a wall collision!
                //blocked.forEach(b => {
                var ls = blocked.map(b => LLI(ln, b))
                //const l = LLI(ln,blocked[0])
                ls.forEach(l => {
                    if (!l) {
                        // this is imposible
                        throw new Error("IMPOSSIBLE")
                    }
                    // do cross lines
                    after(l)
                })
                
                return;
            } else {
                const d = nodes.indexOf(con)
                if (nodes[d].edges.includes(i)) {
                    return
                }
                //connect the nodes
                nodes[i].edges.push(d)
                nodes[d].edges.push(i)
                after(con)
            }
        });
    })
    return nodes;
}

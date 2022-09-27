import type { Node } from "./astar"


enum GID {
    EMPTY,
    NODE,
    PATH,
    WALL
}
type GridNode = {
    id: GID,
    ref?: any;
}

export type Wall = {
    x: number,
    y: number
    
}

export function Raycast(inp: Node[], walls?: Wall[]): Node[] {
    if (walls === undefined) {
        walls = [];
    }
    const sw = Math.abs(Math.min(...[...inp,...walls].map((r) => r.x)))
    const w = Math.max(...[...inp,...walls].map((r) => r.x)) + 1 + sw
    const sh = Math.abs(Math.min(...[...inp,...walls].map((r) => r.y)))
    const h = Math.max(...[...inp,...walls].map((r) => r.y))+1+sh
    //console.log(w,h,sw,sh)
    //console.log(w,h)
    const matrix: GridNode[][] = Array.from({length: h}, () => Array.from({length:w},() => {return {id:GID.EMPTY}} ))
    walls.forEach(element => {
        matrix[element.y+sh][element.x+sw] = {id:GID.WALL}
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

                        const ne = inp.push({x:(tracker.x-sw)+dx, y:(tracker.y-sh)+dy, ox:tracker.x-sw, oy:tracker.y-sh, edges: [i,d.ref]})-1
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
    return inp
}

import type { Node } from "./astar"


enum GID {
    EMPTY,
    NODE,
    PATH
}
type GridNode = {
    id: GID,
    ref?: any;
}

export function Raycast(inp: Node[]): Node[] {
    const w = inp.map((r) => r.x).reduce((x,y) => x > y ? x : y) + 1
    const h = inp.map((r) => r.y).reduce((x,y) => x > y ? x : y) + 1
    //console.log(w,h)
    const matrix: GridNode[][] = Array.from({length: h}, () => Array.from({length:w},() => {return {id:GID.EMPTY}} ))
    inp.forEach((node, i) => {
        matrix[node.y][node.x] = {id: GID.NODE, ref: i}
    })
    const directions = [
        [0,1], //down
        [0,-1],//up
        [1,0],//right
        [-1,0]//left
    ]
    inp.forEach((node, i) => {
        directions.forEach((dir) => {
            const tracker = {...node}
            //console.log(dir)
            while (true) {
                tracker.x += dir[0]
                tracker.y += dir[1]
                if (tracker.x < 0 || tracker.x >= w || tracker.y < 0 || tracker.y >= h) {
                    //console.log(tracker.x, tracker.y, "left graph")
                    break;
                }
                const d = matrix[tracker.y][tracker.x]
                if (d.id == GID.EMPTY) {
                    matrix[tracker.y][tracker.x] = { id: GID.PATH, ref: i }
                } else if (d.id == GID.NODE) {
                    //console.log(i,"form connection to node",d.ref)
                    inp[d.ref].edges.push(i)
                    inp[i].edges.push(d.ref)
                    break;
                } else if (d.id == GID.PATH) {
                    if (inp[i].edges.includes(d.ref)) {
                        //console.log("link already formed: ",i,"&",d.ref)
                        break
                    }
                    //console.log("create node at ",tracker.x,tracker.y, " and connect it with ",i,"&",d.ref)
                    const ne = inp.push({x:tracker.x, y:tracker.y, edges: [i,d.ref]})-1
                    inp[i].edges.push(ne)
                    inp[d.ref].edges.push(ne)
                    break
                }
            }
        })
    })
    //console.log(inp)
    //console.log(matrix)
    return inp
}
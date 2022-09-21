import type { Node } from "./astar";
export function randomNodes(amt: number, mincon: number = 2): Node[] {
    const xy: {x: number, y: number, edges?: number[]}[] = [];
    for (let index = 0; index < amt; index++) {
        xy.push({
            x: Math.floor(Math.random()*1024),
            y: Math.floor(Math.random()*1024)
        })
    }
    for (let indux = 0; indux < amt; indux++) {
        for (let i = 0; i < mincon; i++) {
            const pair = Math.floor(Math.random()*(amt))
            xy[indux].edges = [...(xy[indux].edges || []), pair ]
            xy[pair].edges = [...(xy[pair].edges || []), indux]
            //console.log(indux,"<=>",pair)
        }
    }
    return xy.filter((r) => r.edges != undefined) as Node[];

}
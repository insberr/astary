import type { Node } from "./astar";
import type {Line} from "./col"
export function randomNodes(amt: number, mincon: number = 2): Node[] {
    const minDistance = 20;
    const xy: {x: number, y: number, edges?: number[]}[] = [];
    for (let index = 0; index < amt; index++) {
        const rx = Math.floor(Math.random()*amt);
        const ry = Math.floor(Math.random()*amt);
        if (xy.some((n) => (Math.abs(n.x - rx) < minDistance) || (Math.abs(n.y - ry) < minDistance))) {
            xy.push({
                x: rx + minDistance,
                y: ry + minDistance,
            })
        }
        xy.push({
            x: Math.floor(Math.random()*amt),
            y: Math.floor(Math.random()*amt)
        })
    }
    for (let indux = 0; indux < amt; indux++) {
        for (let i = 0; i < mincon; i++) {
            const pair = Math.floor(Math.random()*(amt))
            if (xy[indux].edges?.includes(pair)) {
                i--;
                continue;
            }
            xy[indux].edges = [...(xy[indux].edges || []), pair ]
            xy[pair].edges = [...(xy[pair].edges || []), indux]
            //console.log(indux,"<=>",pair)
        }
    }
    return xy.filter((r) => r.edges != undefined) as Node[];

}

export function randomWalls(amt: number, space: number, length: number): Line[] {
    const xy: {sx: number, sy: number, ex: number, ey: number}[] = [];
    for (let index = 0; index < amt; index++) {
        const rx = Math.floor(Math.random()*space);
        const ry = Math.floor(Math.random()*space);
        const d = Math.floor(Math.random()*100) > 50 ? 1 : 0;
        xy.push({
            sx: rx,
            sy: ry,
            ex: d ? rx + length : rx,
            ey: d ? ry : ry + length,
        })
    }
    return xy;

}
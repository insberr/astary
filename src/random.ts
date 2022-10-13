import type { Node } from './astar';
import type { Line } from './col';

// TODO: Optimize the if wall or node already exists there continue to something better, to reduce the amount of loops
export function randomNodes2(
    amount: number,
    width: number,
    height: number,
    distance: number,
    alignment?: number,
    mincon: number = 2
): Node[] {
    const generatedNodes: Node[] = [];

    for (let i = 0; i < amount; null) {
        let randomX = Math.floor(Math.random() * width);
        let randomY = Math.floor(Math.random() * height);

        if (alignment) {
            randomX = Math.round(randomX / alignment) * alignment;
            randomY = Math.round(randomY / alignment) * alignment;
        }
        if (
            generatedNodes.filter((n) => {
                if (n.x == randomX && n.y == randomY) false;
                if (Math.abs(n.x - randomX) > distance || Math.abs(n.y - randomY) > distance)
                    return false;
                return true;
            }).length !== 0
        ) {
            continue;
        }

        generatedNodes.push({ x: randomX, y: randomY, edges: new Set<number>() });
        i++;
    }

    return generatedNodes;
}

export function randomNodes(amt: number, mincon: number = 2): Node[] {
    const xy: { x: number; y: number; edges?: Set<number> }[] = [];
    for (let index = 0; index < amt; index++) {
        const rx = Math.floor(Math.random() * amt);
        const ry = Math.floor(Math.random() * amt);
        xy.push({
            x: Math.floor(rx),
            y: Math.floor(ry),
        });
    }
    for (let indux = 0; indux < amt; indux++) {
        for (let i = 0; i < mincon; i++) {
            const pair = Math.floor(Math.random() * amt);
            if (xy[indux].edges?.has(pair)) {
                i--;
                continue;
            }
            xy[indux].edges = new Set<number>([...(xy[indux].edges || []), pair]);
            xy[pair].edges = new Set<number>([...(xy[pair].edges || []), indux]);
            //console.log(indux,"<=>",pair)
        }
    }
    return xy.filter((r) => r.edges != undefined) as Node[];
}

export function randomWalls2(
    amount: number,
    width: number,
    height: number,
    distance: number,
    direction?: number
): Line[] {
    const generatedWalls: Line[] = [];

    for (let i = 0; i < amount; null) {
        let dir = Math.floor(Math.random() * 100) > 50 ? 1 : 0;

        let randomSX = Math.floor(Math.random() * width);
        let randomSY = Math.floor(Math.random() * height);
        let randomEX = Math.floor(Math.random() * width);
        let randomEY = Math.floor(Math.random() * height);
        if (dir === 1) {
            // vertical
            randomEX = randomSX;
        } else {
            // horizontal
            randomEY = randomSY;
        }

        if (
            generatedWalls.filter((w) => {
                if (
                    w.sx === randomSX &&
                    w.sy === randomSY &&
                    w.ex === randomEX &&
                    w.ey === randomEY
                )
                    return false;
                if (
                    (Math.abs(w.sx - randomSX) > distance ||
                        Math.abs(w.sy - randomSY) > distance) &&
                    (Math.abs(w.ex - randomEX) > distance || Math.abs(w.ey - randomEY) > distance)
                )
                    return false;
                return true;
            }).length !== 0
        ) {
            continue;
        }

        generatedWalls.push({ sx: randomSX, sy: randomSY, ex: randomEX, ey: randomEY });
        i++;
    }

    return generatedWalls;
}

export function randomWalls(amt: number, space: number, length: number): Line[] {
    const xy: { sx: number; sy: number; ex: number; ey: number }[] = [];
    for (let index = 0; index < amt; index++) {
        const rx = Math.floor(Math.random() * space);
        const ry = Math.floor(Math.random() * space);
        const d = Math.floor(Math.random() * 100) > 50 ? 1 : 0;
        xy.push({
            sx: rx,
            sy: ry,
            ex: d ? rx + length : rx,
            ey: d ? ry : ry + length,
        });
    }
    return xy;
}

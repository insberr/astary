import type { Node } from './astar';
import type { Line } from './col';

function tryPos(generatedNodes: Node[], distance: number, x: number, y: number): Node[] {
    return generatedNodes.filter((n) => {
        if (n.x == x && n.y == y) return false;
        if ((Math.abs(n.x - x) > distance) || (Math.abs(n.y - y) > distance)) return false;
        return true;
    })
}
// TODO: Optimize the if wall or node already exists there continue to something better, to reduce the amount of loops
export type RandomNodesOptions = {
    distance?: number;
    padding?: number;
    alignment?: number;
    connections?: number;
}
// options used to be distance, alignment, connections
export function randomNodes2(
    amount: number,
    width: number,
    height: number,
    options: RandomNodesOptions = {}
): Node[] {
    const generatedNodes: Node[] = [];

    const distance = options.distance || 1;
    const padding = options.padding || undefined;
    const alignment = options.alignment || undefined;
    const connections = options.connections || undefined;


    for (let i = 0; i < amount; null) {
        let randomX = Math.floor(Math.random() * width);
        let randomY = Math.floor(Math.random() * height);

        if (alignment && alignment > 1) {
            randomX = Math.round(randomX / alignment) * alignment;
            randomY = Math.round(randomY / alignment) * alignment;
        }

        // Its supposed to keep nodes from being generated within the distance from the edges
        if (padding) {
            if (randomX < padding) {
                randomX = randomX + padding;
            } else if (randomX > width - padding) {
                randomX = randomX - padding;
            }
            if (randomY < padding) {
                randomY = randomY + padding;
            } else if (randomY > height - padding) {
                randomY = randomY - padding;
            }
        }

        const triedPos = tryPos(generatedNodes, distance, randomX, randomY);
        if (triedPos.length > 0) {
            // bad for preformance
            continue;
        }
        
        generatedNodes.push({ x: randomX, y: randomY, edges: new Set<number>() });
        i++;
    }

    if (connections) {
        for (let indux = 0; indux < amount; indux++) {
            for (let ii = 0; ii < connections; ii++) {
                const pair = Math.floor(Math.random() * amount);
                if (generatedNodes[indux].edges?.has(pair)) {
                    // ii--;
                    continue;
                }

                let gni = generatedNodes[indux];
                let gnp = generatedNodes[pair];
                if (gni.x === gnp.x || gni.y === gnp.y) {
                    generatedNodes[indux].edges = new Set<number>([...(generatedNodes[indux].edges || []), pair]);
                    generatedNodes[pair].edges = new Set<number>([...(generatedNodes[pair].edges || []), indux]);
                } else {
                    // ii--;
                    continue;
                }
                //console.log(indux,"<=>",pair)
            }
        }
    }

    return generatedNodes;
}

export function randomWalls2(
    amount: number,
    width: number,
    height: number,
    distance: number,
    length?: number,
    direction?: number,
): Line[] {
    const generatedWalls: Line[] = [];

    for (let i = 0; i < amount; null) {
        let dir = Math.floor(Math.random() * 100) > 50 ? 1 : 0;

        let randomSX = Math.floor(Math.random() * width);
        let randomSY = Math.floor(Math.random() * height);
        let randomEX = length ? randomSX + length : Math.floor(Math.random() * width);
        let randomEY = length ? randomSY + length : Math.floor(Math.random() * height);
        if (dir === 1) {
            // vertical
            randomEX = randomSX;
        } else {
            // horizontal
            randomEY = randomSY;
        }

        if (randomEX > width) {
            randomEX = width;
        }
        if (randomEY > height) {
            randomEY = height;
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

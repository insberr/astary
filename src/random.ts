import type { NewNode, NewWall, Node } from './astar';
import type { Line } from './col';

function tryPos(generatedNodes: NewNode[], distance: number, x: number, y: number): NewNode[] {
    // bad

    return (generatedNodes as NewNode[]).filter((n: NewNode) => {
        if (n.x == x && n.y == y) return true;
        if (Math.abs(n.x - x) > distance || Math.abs(n.y - y) > distance) return false;
        return true;
    });
}
// TODO: Optimize the if wall or node already exists there continue to something better, to reduce the amount of loops
export type RandomNodesOptions = {
    distance?: number;
    padding?: number;
    alignment?: number;
    connections?: number;
};
// options used to be distance, alignment, connections
// export function randomNodes2(
//     amount: number,
//     width: number,
//     height: number,
//     options: RandomNodesOptions = {}
// ): NewNode[] {
//     const generatedNodes: Node[] = [];

//     const distance = options.distance || 1;
//     const padding = options.padding || undefined;
//     const alignment = options.alignment || undefined;
//     const connections = options.connections || undefined;

//     for (let i = 0; i < amount; null) {
//         let randomX = Math.floor(Math.random() * width);
//         let randomY = Math.floor(Math.random() * height);

//         if (alignment && alignment > 1) {
//             randomX = Math.round(randomX / alignment) * alignment;
//             randomY = Math.round(randomY / alignment) * alignment;
//         }

//         // Its supposed to keep nodes from being generated within the distance from the edges
//         if (padding) {
//             if (randomX < padding) {
//                 randomX = randomX + padding;
//             } else if (randomX > width - padding) {
//                 randomX = randomX - padding;
//             }
//             if (randomY < padding) {
//                 randomY = randomY + padding;
//             } else if (randomY > height - padding) {
//                 randomY = randomY - padding;
//             }
//         }

//         const triedPos = tryPos(generatedNodes, distance, randomX, randomY);
//         if (triedPos.length > 0) {
//             // bad for preformance
//             continue;
//         }

//         generatedNodes.push({
//             x: randomX,
//             y: randomY,
//             edges: new Set<number>(),
//             addlWeight: Math.floor(Math.random() * 100),
//         });
//         i++;
//     }

//     if (connections) {
//         for (let indux = 0; indux < amount; indux++) {
//             for (let ii = 0; ii < connections; ii++) {
//                 const pair = Math.floor(Math.random() * amount);
//                 if (generatedNodes[indux].edges?.has(pair)) {
//                     // ii--;
//                     continue;
//                 }

//                 let gni = generatedNodes[indux];
//                 let gnp = generatedNodes[pair];
//                 if (gni.x === gnp.x || gni.y === gnp.y) {
//                     generatedNodes[indux].edges = new Set<number>([
//                         ...(generatedNodes[indux].edges || []),
//                         pair,
//                     ]);
//                     generatedNodes[pair].edges = new Set<number>([
//                         ...(generatedNodes[pair].edges || []),
//                         indux,
//                     ]);
//                 } else {
//                     // ii--;
//                     continue;
//                 }
//                 //console.log(indux,"<=>",pair)
//             }
//         }
//     }

//     return generatedNodes;
// }

export function randomNodes({
    amount,
    width,
    height,
    distance = 1,
    padding = undefined,
    alignment = undefined,
    connections = undefined,
}: {
    amount: number;
    width: number;
    height: number;
    distance?: number;
    padding?: number;
    alignment?: number;
    connections?: number;
}): NewNode[] {
    const generatedNodes: NewNode[] = [];

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
            // bad for performance
            continue;
        }

        generatedNodes.push({
            x: randomX,
            y: randomY,
            edges: {
                indexes: new Set<number>(),
                datas: [],
            },
            weight: 0,
        });
        i++;
    }

    if (connections) {
        for (let indux = 0; indux < amount; indux++) {
            for (let ii = 0; ii < connections; ii++) {
                const pair = Math.floor(Math.random() * amount);
                if (generatedNodes[indux].edges.indexes.has(pair)) {
                    // ii--;
                    continue;
                }

                let gni = generatedNodes[indux];
                let gnp = generatedNodes[pair];
                if (gni.x === gnp.x || gni.y === gnp.y) {
                    generatedNodes[indux].edges.indexes.add(pair);
                    generatedNodes[pair].edges.indexes.add(indux);
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

export function randomWalls({
    amount,
    width,
    height,
    distance,
    length,
    direction,
}: {
    amount: number;
    width: number;
    height: number;
    distance: number;
    length?: number;
    direction?: number;
}): NewWall[] {
    const generatedWalls: NewWall[] = [];

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
                    w.s.x === randomSX &&
                    w.s.y === randomSY &&
                    w.e.x === randomEX &&
                    w.e.y === randomEY
                )
                    return false;
                if (
                    (Math.abs(w.s.x - randomSX) > distance ||
                        Math.abs(w.s.y - randomSY) > distance) &&
                    (Math.abs(w.e.x - randomEX) > distance || Math.abs(w.e.y - randomEY) > distance)
                )
                    return false;
                return true;
            }).length !== 0
        ) {
            continue;
        }

        generatedWalls.push({ s: { x: randomSX, y: randomSY }, e: { x: randomEX, y: randomEY } });
        i++;
    }

    return generatedWalls;
}

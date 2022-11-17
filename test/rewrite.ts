import { randomNodes, randomWalls, Raycast } from '../src/astar';

function test() {
    const tries = 1;
    const width = 50000;
    const height = 50000;
    const maxConnections = 2;

    const numNodes = 10000;

    const numWalls = 200;
    const distance = 50;
    const length = 100;

    const per: number[] = [];
    const amtOfNodes: number[] = [];

    const ts = performance.now();
    for (let i = 0; i < tries; i++) {
        const start = performance.now();
        const nodes = randomNodes({ amount: numNodes, width, height, distance });
        const walls = randomWalls({ amount: numWalls, width, height, distance, length });
        const raycast = Raycast(nodes, walls, { maxConnections });
        amtOfNodes.push(raycast.nodes.length);
        const end = performance.now();
        per.push(end - start);
    }
    const te = performance.now();

    const avg = per.reduce((a, b) => a + b, 0) / per.length;
    console.log('code', tries, width, height, maxConnections, numNodes, numWalls, distance, length);
    console.log('Done In', te - ts, 'ms');
    console.log('Average Time:', avg, 'ms');
    console.log('Average Nodes:', amtOfNodes.reduce((a, b) => a + b, 0) / amtOfNodes.length);

    // const nodes: NewNode[] = randomNodes3(10, 50, 50, { alignment: 2 }); // [
    // //     { x: 5, y: 5, edges: {} },
    // //     { x: 10, y: 2, edges: {} },
    // //     { x: 20, y: 10, edges: {} },
    // //     { x: 2, y: 10, edges: {} },
    // // ];
    // const walls: NewWall[] = [
    //     { s: { x: 0, y: 0 }, e: { x: 0, y: 30 } },
    //     { s: { x: 0, y: 20 }, e: { x: 3, y: 20 } },
    //     { s: { x: 20, y: 20 }, e: { x: 20, y: 0 } },
    //     { s: { x: 20, y: 0 }, e: { x: 0, y: 0 } },
    // ];
    // // const walls: NewWall[] = [{ s: { x: 15, y: 0 }, e: { x: 15, y: 15 } }];
    // const cast = Raycast(nodes, walls, { width: 100, height: 100 });
    // console.dir(cast.nodes, { depth: 10 });
    // walls.push({ s: { x: 0, y: 0 }, e: { x: 0, y: 30 } });
    // const castlen = cast.nodes.length;
    // const cast2 = Raycast(cast.nodes, walls, { width: 100, height: 100 });
    // console.dir(cast2.nodes, { depth: 10 });
    // console.log(castlen, cast2.nodes.length);
    // // const newerNodes = randomNodes3(10, 50, 50, { alignment: 2 });
}

test();


import { NewWall, NewNode, randomNodes3 } from '../src/astar';
import { Raycast, findWithHeight } from '../src/raycast';

function test() {
    const nodes: NewNode[] = randomNodes3(10, 50, 50, { alignment: 2 }); // [
    //     { x: 5, y: 5, edges: {} },
    //     { x: 10, y: 2, edges: {} },
    //     { x: 20, y: 10, edges: {} },
    //     { x: 2, y: 10, edges: {} },
    // ];
    const walls: NewWall[] = [
        { s: { x: 0, y: 0 }, e: { x: 0, y: 30 } },
        { s: { x: 0, y: 20 }, e: { x: 3, y: 20 } },
        { s: { x: 20, y: 20 }, e: { x: 20, y: 0 } },
        { s: { x: 20, y: 0 }, e: { x: 0, y: 0 } },
    ];
    // const walls: NewWall[] = [{ s: { x: 15, y: 0 }, e: { x: 15, y: 15 } }];
    const cast = Raycast(nodes, walls, { width: 100, height: 100 });
    console.dir(cast.nodes, { depth: 10 });
    walls.push({ s: { x: 0, y: 0 }, e: { x: 0, y: 30 } });
    const castlen = cast.nodes.length;
    const cast2 = Raycast(cast.nodes, walls, { width: 100, height: 100 });
    console.dir(cast2.nodes, { depth: 10 });
    console.log(castlen, cast2.nodes.length);
    // const newerNodes = randomNodes3(10, 50, 50, { alignment: 2 });
}

test();


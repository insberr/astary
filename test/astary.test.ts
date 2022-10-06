let testContext: any;
beforeEach(() => {
    testContext = {};
});

require('source-map-support').install();
import * as astar from '../src/astar';
import * as fs from 'fs';
import { defaultFilterFunction } from '../src/generateNodesFromSVG';

afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
});
//import * as benchmark from 'benchmark'
//const { AssertionError } = require('assert');
// const { createImageData } = require('canvas')
// var PNG = require('pngjs2').PNG;

//const bench = new benchmark.Suite;
/*
bench.on('cycle', function(event: any) {
    console.log(String(event.target));
  })
bench.on("error", () => {
    console.error("ruh roh!");
})*/

const onek = JSON.parse(fs.readFileSync(__dirname + '/1k.json').toString());
// uncommented
/*bench.on('complete', function() {
    console.log(this);
})*/

let isBenchmark = false;
/*fterEach(
    () => { testContext.currentTest.state != 'failed' ? bench.add(testContext.currentTest.title, testContext.currentTest.fn) : null }
)
afterAll(
    () => { isBenchmark = true; console.log("benchmarking"); return bench.run({async: true}) }
)*/
describe('AStar', () => {
    it('straight line', () => {
        const res = astar.AStar(0, 5, [
            { x: 0, y: 0, edges: new Set([1]) },
            { x: 1, y: 0, edges: new Set([0, 2]) },
            { x: 2, y: 0, edges: new Set([1, 3]) },
            { x: 3, y: 0, edges: new Set([2, 4]) },
            { x: 4, y: 0, edges: new Set([3, 5]) },
            { x: 5, y: 0, edges: new Set([4]) },
        ]);
        //if (!isBenchmark) console.log(res)
        expect(res).toEqual([0, 1, 2, 3, 4, 5]);
    });
    it('tgraph with weight', () => {
        const res = astar.AStar(0, 5, [
            { x: 0, y: 0, edges: new Set([1, 2]) },
            { x: 2, y: 2, edges: new Set([3, 4]) },
            { x: 2, y: -2, edges: new Set([1, 4]) },
            { x: 6, y: 2, edges: new Set([4, 5]) },
            { x: 6, y: -2, addlWeight: 10, edges: new Set([5]) },
            { x: 8, y: 0, edges: new Set() },
        ]);
        //if (!isBenchmark) console.log(res)
        expect(res).not.toContain(4); // cannot contain a 4
    });
    it('should error without path', () => {
        expect(() => {
            astar.AStar(0, 1, [
                { x: 0, y: 0, edges: new Set() },
                { x: 1, y: 1, edges: new Set() },
            ]);
        }).toThrowError();
    });
});

describe('stress test', () => {
    it('1k', () => {
        astar.AStar(0, 999, onek);
    });
});

describe('random', () => {
    it('should generate a random nodes (100 nodes, 10+ connections)', () => {
        const d = astar.randomNodes(100, 10);
        expect(d).toHaveLength(100);
    });
    it('random graph pathable (100 nodes, 10+ connections)', () => {
        const d = astar.randomNodes(100, 10);
        astar.AStar(0, 99, d);
    });
    describe('random walls', () => {
        it('should generate 100 walls', () => {
            const d = astar.randomWalls(100, 1, 5);
            expect(d).toHaveLength(100);
        });
        // more random wall tests.
    });
});

const svg = fs.readFileSync(__dirname + '/BHS_Building_Map_SVG.svg', 'utf8');

describe('generate nodes from svg', () => {
    it('should make nodes from node points on image', () => {
        const paths = astar.svgToPaths(svg, defaultFilterFunction);
        const nodes = astar.generateNodes(paths);
        //console.log(nodes);
    });
});

describe('generate nodes from svg then raycast', () => {
    it('should make nodes from node points on image, then raycast', () => {
        const paths = astar.svgToPaths(svg, defaultFilterFunction);
        const nodes = astar.generateNodes(paths);
        //console.log(nodes);

        const newNodes = astar.Raycast(nodes, []);
        //console.log(newNodes)

        //console.log('raycast again');
        const again = astar.Raycast(newNodes, []);
        //console.log(again);
    });
});

describe('generate nodes from svg then raycast with walls', () => {
    it('should make nodes from node points on image, then raycast with walls so yeah', () => {
        const paths = astar.svgToPaths(svg, defaultFilterFunction);
        const nodes = astar.generateNodes(paths);
        const walls = astar.generateWalls(paths);
        //console.log(nodes);
        //console.log(walls);

        const raycastNodes = astar.Raycast(nodes, walls);
        //console.log(raycastNodes)
    });
});

describe('raycast', () => {
    it('should connect nodes in line.', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: new Set() },
                { x: 10, y: 0, edges: new Set() },
            ],
            []
        );
        //console.log(con)
        expect(con[0].edges.size).toEqual(1);
        expect(con[1].edges.size).toEqual(1);
    });
    it('should connect 2 nodes with a 3rd', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: new Set() },
                { x: 10, y: 10, edges: new Set() },
            ],
            []
        );
        //console.log(con)
        astar.AStar(0, 1, con);
    });
    it('raycast negative test', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: new Set() },
                { x: 5, y: 0, edges: new Set() },
                { x: 10, y: 0, edges: new Set() },
                { x: 5, y: -10, edges: new Set() },
            ],
            []
        );
    });

    it('should decimal', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: new Set() },
                { x: 0, y: 5, edges: new Set() },
                { x: 10.3, y: 5, edges: new Set() },
                { x: 10.3, y: -5, edges: new Set() },
            ],
            [{ sx: 1.04, sy: 3, ex: 2, ey: -5 }]
        );
        expect(con[0].edges).not.toContainEqual(3);
        expect(con[0].edges).toContainEqual(1);
        astar.AStar(0, 3, con);
    });

    describe('walls', () => {
        it('shouldnt connect through walls', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: new Set() },
                    { x: 10, y: 0, edges: new Set() },
                    { x: 5, y: 5, edges: new Set() },
                ],
                [
                    { sx: 3, sy: -20, ex: 3, ey: 20 },
                    { sx: 7, sy: -20, ex: 7, ey: 20 },
                ]
            );
            expect(con).toHaveLength(3);
            expect(() => astar.AStar(0, 1, con)).toThrowError();
            expect(() => astar.AStar(0, 2, con)).toThrowError();
        });
        it('should handle walls in the middle of nowhere', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: new Set() },
                    { x: 10, y: 0, edges: new Set() },
                ],
                [
                    {
                        sx: -99,
                        sy: 99,
                        ex: -98,
                        ey: 98,
                    },
                ]
            );
            // We love js Sets. use spread [...set] to convert it to an array.
            expect([...con[0].edges]).toStrictEqual([1]);
            expect([...con[1].edges]).toStrictEqual([0]);
        });
        it('wall', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: new Set() },
                    { x: 0, y: 5, edges: new Set() },
                    { x: 10, y: 5, edges: new Set() },
                    { x: 10, y: 0, edges: new Set() },
                ],
                [{ sx: 1, sy: 0, ex: 2, ey: 1 }]
            );
            expect(con[0].edges).not.toContainEqual(3);
            expect(con[0].edges).toContainEqual(1);
            astar.AStar(0, 3, con);
        });
        it('should navigate around', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: new Set() },
                    { x: 5, y: 6, edges: new Set() },
                    { x: 10, y: 0, edges: new Set() },
                ],
                [{ sx: 5, sy: 5, ex: 5, ey: -5 }]
            );
            const path = astar.AStar(0, 2, con);
            expect(path.filter((r) => con[r].raycast).map((z) => con[z])).toHaveLength(2);
            expect(path).toStrictEqual([0, 3, 1, 4, 2]);
        });
        it('should box in the node', () => {
            const con = astar.Raycast(
                [
                    { x: 10, y: 10, edges: new Set() },
                    { x: 5, y: 10, edges: new Set() },
                    { x: 15, y: 10, edges: new Set() },
                    { x: 10, y: 15, edges: new Set() },
                    { x: 10, y: 5, edges: new Set() },
                ],
                [
                    { sx: 7, sy: 7, ex: 7, ey: 12 },
                    { sx: 7, sy: 12, ex: 12, ey: 12 },
                    { sx: 12, sy: 12, ex: 12, ey: 7 },
                    { sx: 12, sy: 7, ex: 7, ey: 7 },
                ]
            );
            expect(con[0].edges.size).toEqual(0);
        });
        it('should respect already existing edges', () => {
            const con = astar.Raycast(
                [
                    { x: 10, y: 10, edges: new Set([1]) },
                    { x: 5, y: 10, edges: new Set([0]) },
                    { x: 15, y: 10, edges: new Set() },
                    { x: 10, y: 15, edges: new Set() },
                    { x: 10, y: 5, edges: new Set() },
                ],
                [
                    { sx: 7, sy: 7, ex: 7, ey: 12 },
                    { sx: 7, sy: 12, ex: 12, ey: 12 },
                    { sx: 12, sy: 12, ex: 12, ey: 7 },
                    { sx: 12, sy: 7, ex: 7, ey: 7 },
                ]
            );
            expect(con[0].edges.size).toEqual(1);
            expect(con[0].edges).toContain(1);
        });
        it('should split the ray correctly', () => {
            const con = astar.Raycast(
                [
                    { x: -5, y: 5, edges: new Set() },
                    { x: 5, y: 5, edges: new Set() },
                    { x: 0, y: 0, edges: new Set() },
                ],
                [
                    { sx: -3, sy: -1, ex: -3, ey: 4 },
                    { sx: 3, sy: -1, ex: 3, ey: 4 },
                ]
            );
            console.log(con);
            expect(con.filter((x) => x.raycast)).toHaveLength(1); // only 1 raycasted node
            expect(astar.AStar(2, 0, con)).toHaveLength(3);
            expect(astar.AStar(2, 1, con)).toHaveLength(3);
        });
    });
});
/*describe('makeGraph', () => {
    it('should make a graph', async () => {
        /*const res = await astar.makeUint8ClampedArray().then(a => {
            return a;
        })
        console.log(res)
        astar.makeNodes()
    })
})*/

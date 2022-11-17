import * as astar from '../src/astar';
import * as fs from 'fs';
import { defaultFilterFunction } from '../src/generateNodesFromSVG';

require('source-map-support').install();

let testContext: any;
beforeEach(() => {
    testContext = {};
});

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
            { x: 0, y: 0, edges: { indexes: new Set([1]) } },
            { x: 1, y: 0, edges: { indexes: new Set([0, 2]) } },
            { x: 2, y: 0, edges: { indexes: new Set([1, 3]) } },
            { x: 3, y: 0, edges: { indexes: new Set([2, 4]) } },
            { x: 4, y: 0, edges: { indexes: new Set([3, 5]) } },
            { x: 5, y: 0, edges: { indexes: new Set([4]) } },
        ]);
        //if (!isBenchmark)
        console.log(res);
        expect(res).toEqual([0, 1, 2, 3, 4, 5]);
    });
    it('tgraph with weight', () => {
        const res = astar.AStar(0, 5, [
            { x: 0, y: 0, edges: { indexes: new Set([1, 2]) } },
            { x: 2, y: 2, edges: { indexes: new Set([3, 4]) } },
            { x: 2, y: -2, edges: { indexes: new Set([1, 4]) } },
            { x: 6, y: 2, edges: { indexes: new Set([4, 5]) } },
            { x: 6, y: -2, weight: 10, edges: { indexes: new Set([5]) } },
            { x: 8, y: 0, edges: { indexes: new Set() } },
        ]);
        //if (!isBenchmark) console.log(res)
        expect(res).not.toContain(4); // cannot contain a 4
    });
    it('should error without path', () => {
        expect(() => {
            astar.AStar(0, 1, [
                { x: 0, y: 0, edges: { indexes: new Set() } },
                { x: 1, y: 1, edges: { indexes: new Set() } },
            ]);
        }).toThrowError();
    });
});

describe('stress test', () => {
    it('1k', () => {
        astar.AStar(0, 999, onek);
    });
});

describe('random (canvas size 1000 x 1000)', () => {
    it('should generate random nodes (100 nodes, 10 connections)', () => {
        const d = astar.randomNodes({
            amount: 100,
            width: 1000,
            height: 1000,
            distance: 5,
            alignment: 0,
            connections: 10,
        });
        expect(d).toHaveLength(100);
    });
    it('random graph pathable (100 nodes, 10 connections)', () => {
        const d = astar.randomNodes({
            amount: 100,
            width: 1000,
            height: 1000,
            distance: 5,
            connections: 10,
        });
        astar.AStar(0, 99, d);
    });
    it('should generate random nodes (1000 nodes, 10 connections)', () => {
        const d = astar.randomNodes({
            amount: 1000,
            width: 5000,
            height: 5000,
            distance: 5,
            alignment: 0,
            connections: 10,
        });
        expect(d).toHaveLength(1000);
    });
    describe('random walls', () => {
        it('should generate 100 walls', () => {
            const d = astar.randomWalls({
                amount: 100,
                width: 1000,
                height: 1000,
                distance: 10,
                length: 5,
            });
            expect(d).toHaveLength(100);
        });
        // more random wall tests.
    });
});

const svg = fs.readFileSync(__dirname + '/BHS_Building_Map_SVG.svg', 'utf8');

describe('Map SVG Tests', () => {
    it('should make nodes from node points on image', () => {
        const paths = astar.svgToPaths(svg, defaultFilterFunction);
        const nodes = astar.generateNodes(paths);
        //console.log(nodes);
    });

    it('should make nodes from node points on image, then raycast', () => {
        const paths = astar.svgToPaths(svg, defaultFilterFunction);
        const nodes = astar.generateNodes(paths);
        console.log(nodes);

        const newNodes = astar.Raycast(nodes, []);
        //console.log(newNodes)

        //console.log('raycast again');
        const again = astar.Raycast(newNodes.nodes, []);
        //console.log(again);
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
});

describe('Raycast Tests', () => {
    it('Should connect nodes in line.', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: { indexes: new Set() } },
                { x: 10, y: 0, edges: { indexes: new Set() } },
            ],
            []
        );
        //console.log(con)
        expect(con.nodes[0].edges.indexes.size).toEqual(1);
        expect(con.nodes[1].edges.indexes.size).toEqual(1);
    });
    it('should connect 2 nodes with a 3rd', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: { indexes: new Set() } },
                { x: 10, y: 10, edges: { indexes: new Set() } },
            ],
            []
        );
        //console.log(con)
        astar.AStar(0, 1, con.nodes);
    });
    it('raycast negative test', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: { indexes: new Set() } },
                { x: 5, y: 0, edges: { indexes: new Set() } },
                { x: 10, y: 0, edges: { indexes: new Set() } },
                { x: 5, y: -10, edges: { indexes: new Set() } },
            ],
            []
        );
    });

    it('should decimal', () => {
        const con = astar.Raycast(
            [
                { x: 0, y: 0, edges: { indexes: new Set() } },
                { x: 0, y: 5, edges: { indexes: new Set() } },
                { x: 10.3, y: 5, edges: { indexes: new Set() } },
                { x: 10.3, y: -5, edges: { indexes: new Set() } },
            ],
            [{ s: { x: 1.04, y: 3 }, e: { x: 2, y: -5 } }]
        );
        expect(con.nodes[0].edges.indexes).not.toContainEqual(3);
        expect(con.nodes[0].edges.indexes).toContainEqual(1);
        astar.AStar(0, 3, con.nodes);
    });

    describe('walls', () => {
        it('shouldnt connect through walls', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: { indexes: new Set() } },
                    { x: 10, y: 0, edges: { indexes: new Set() } },
                    { x: 5, y: 5, edges: { indexes: new Set() } },
                ],
                [
                    { s: { x: 3, y: -20 }, e: { x: 3, y: 20 } },
                    { s: { x: 7, y: -20 }, e: { x: 7, y: 20 } },
                ]
            );
            expect(con.nodes).toHaveLength(3);
            expect(() => astar.AStar(0, 1, con.nodes)).toThrowError();
            expect(() => astar.AStar(0, 2, con.nodes)).toThrowError();
        });
        it('should handle walls in the middle of nowhere', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: { indexes: new Set() } },
                    { x: 10, y: 0, edges: { indexes: new Set() } },
                ],
                [{ s: { x: -99, y: 99 }, e: { x: -98, y: 98 } }]
            );
            // We love js Sets. use spread [...set] to convert it to an array.
            expect([...con.nodes[0].edges.indexes]).toStrictEqual([1]);
            expect([...con.nodes[1].edges.indexes]).toStrictEqual([0]);
        });
        it('wall', () => {
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: { indexes: new Set() } },
                    { x: 0, y: 5, edges: { indexes: new Set() } },
                    { x: 10, y: 5, edges: { indexes: new Set() } },
                    { x: 10, y: 0, edges: { indexes: new Set() } },
                ],
                [{ s: { x: 1, y: 0 }, e: { x: 2, y: 1 } }]
            );
            expect(con.nodes[0].edges.indexes).not.toContainEqual(3);
            expect(con.nodes[0].edges.indexes).toContainEqual(1);
            astar.AStar(0, 3, con.nodes);
        });
        it('should navigate around', () => {
            // TODO: NEED TO ADD POINT ON LINE TEST TO LINE LINE INTERSECT SO WE CAN GET PARARELL LINES ON TOP OF EACH OTHER
            const con = astar.Raycast(
                [
                    { x: 0, y: 0, edges: { indexes: new Set() } },
                    { x: 5, y: 6, edges: { indexes: new Set() } },
                    { x: 10, y: 0, edges: { indexes: new Set() } },
                ],
                [{ s: { x: 5, y: 5 }, e: { x: 5, y: -5 } }]
            );
            const path = astar.AStar(0, 2, con.nodes);
            expect(
                path.filter((r) => con.nodes[r].createdByRaycast).map((z) => con.nodes[z])
            ).toHaveLength(2);
            expect(path).toStrictEqual([0, 3, 1, 4, 2]);
        });
        it('should box in the node', () => {
            const con = astar.Raycast(
                [
                    { x: 10, y: 10, edges: { indexes: new Set() } },
                    { x: 5, y: 10, edges: { indexes: new Set() } },
                    { x: 15, y: 10, edges: { indexes: new Set() } },
                    { x: 10, y: 15, edges: { indexes: new Set() } },
                    { x: 10, y: 5, edges: { indexes: new Set() } },
                ],
                [
                    { s: { x: 7, y: 7 }, e: { x: 7, y: 12 } },
                    { s: { x: 7, y: 12 }, e: { x: 12, y: 12 } },
                    { s: { x: 12, y: 12 }, e: { x: 12, y: 7 } },
                    { s: { x: 12, y: 7 }, e: { x: 7, y: 7 } },
                ]
            );
            expect(con.nodes[0].edges.indexes.size).toEqual(0);
        });
        it('should respect already existing edges', () => {
            const con = astar.Raycast(
                [
                    { x: 10, y: 10, edges: { indexes: new Set([1]) } },
                    { x: 5, y: 10, edges: { indexes: new Set([0]) } },
                    { x: 15, y: 10, edges: { indexes: new Set() } },
                    { x: 10, y: 15, edges: { indexes: new Set() } },
                    { x: 10, y: 5, edges: { indexes: new Set() } },
                ],
                [
                    { s: { x: 7, y: 7 }, e: { x: 7, y: 12 } },
                    { s: { x: 7, y: 12 }, e: { x: 12, y: 12 } },
                    { s: { x: 12, y: 12 }, e: { x: 12, y: 7 } },
                    { s: { x: 12, y: 7 }, e: { x: 7, y: 7 } },
                ]
            );
            expect(con.nodes[0].edges.indexes.size).toEqual(1);
            expect(con.nodes[0].edges.indexes).toContain(1);
        });
        it('should split the ray correctly', () => {
            const con = astar.Raycast(
                [
                    { x: -5, y: 5, edges: { indexes: new Set() } },
                    { x: 5, y: 5, edges: { indexes: new Set() } },
                    { x: 0, y: 0, edges: { indexes: new Set() } },
                ],
                [
                    { s: { x: -3, y: -1 }, e: { x: -3, y: 4 } },
                    { s: { x: 3, y: -1 }, e: { x: 3, y: 4 } },
                ]
            );
            //console.log(con);
            expect(con.nodes.filter((x) => x.createdByRaycast)).toHaveLength(1); // only 1 raycasted node
            expect(astar.AStar(2, 0, con.nodes)).toHaveLength(3);
            expect(astar.AStar(2, 1, con.nodes)).toHaveLength(3);
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

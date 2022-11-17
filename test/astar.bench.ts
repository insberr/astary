require('source-map-support').install();
import { benchmarkSuite } from 'jest-bench';
import { AStar, randomNodes, Raycast } from '../src/astar';
const rng = (max: number) => Math.floor(Math.random() * max);

const width = 50000;
const height = 50000;

let hundred = randomNodes({ amount: 100, width, height, connections: 5 });
let thousand = randomNodes({ amount: 1000, width, height, connections: 5 });
let tenthousand = randomNodes({ amount: 10000, width, height, connections: 5 });
/*
let Rhundred = randomNodes2(100, width, height, 0, 0, 1).map((n) => {
    return { ...n, edges: [] };
});
let Rthousand = randomNodes2(1000, width, height, 5, 5, 1).map((n) => {
    return { ...n, edges: [] };
});
let Rtenthousand = randomNodes2(10000, width, height, 5, 5, 1).map((n) => {
    return { ...n, edges: [] };
});
*/

benchmarkSuite('astar', {
    hundred() {
        AStar(rng(100), rng(100), hundred);
    },
    thousand() {
        AStar(rng(1000), rng(1000), thousand);
    },
    tenthousand() {
        AStar(rng(10000), rng(10000), tenthousand);
    },
});

benchmarkSuite('randomNodes', {
    hundred() {
        randomNodes({ amount: 100, width, height, connections: 5 });
    },
    thousand() {
        randomNodes({ amount: 1000, width, height, connections: 5 });
    },
    tenthousand() {
        randomNodes({ amount: 10000, width, height, connections: 5 });
    },
});

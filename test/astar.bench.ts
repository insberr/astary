import { benchmarkSuite } from "jest-bench";
import { AStar, randomNodes, Node } from "../src/astar"
const rng = (max: number) => Math.floor(Math.random()*max)
let hundred: Node[]
let thousand: Node[]
let tenthousand: Node[]
benchmarkSuite("astar", {
    setup() {
        hundred = randomNodes(100,5)
        thousand = randomNodes(1000,5)
        tenthousand = randomNodes(10000,5)
    },
    hundred() {
        AStar(rng(100),rng(100), hundred)
    },
    thousand() {
        AStar(rng(1000),rng(1000), thousand)
    },
    tenthousand() {
        AStar(rng(10000), rng(10000), tenthousand)
    }
})
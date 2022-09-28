require("source-map-support").install()
import { benchmarkSuite } from "jest-bench";
import { AStar, randomNodes, Raycast } from "../src/astar"
const rng = (max: number) => Math.floor(Math.random()*max)
let hundred = randomNodes(100,5)
let thousand = randomNodes(1000,5)
let tenthousand = randomNodes(10000,5)
let Rhundred = randomNodes(100,1).map((n) => { return {...n, edges:[] }})
let Rthousand = randomNodes(1000,1).map((n) => { return {...n, edges:[] }})
let Rtenthousand = randomNodes(10000,1).map((n) => { return {...n, edges:[] }})
benchmarkSuite("astar", {
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

benchmarkSuite("randomNodes", {
    hundred() {
        randomNodes(100,5)
    },
    thousand() {
        randomNodes(1000,5)
    },
    tenthousand() {
        randomNodes(10000,5)
    }
})
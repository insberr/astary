var assert = require('assert');
var astar = require("..");

const benchmark = require("benchmark");
const bench = new benchmark.Suite;
bench.on('cycle', function(event) {
    console.log(String(event.target));
  })
/*bench.on('complete', function() {
    console.log(this);
})*/
let isBenchmark = false;
afterEach(function() { bench.add(this.currentTest.title, this.currentTest.fn) })
after(() => { isBenchmark = true; console.log("benchmarking"); return bench.run({async: true}) } )
describe("AStar", () => {
    it("straight line", ()=>{
        const res = astar.AStar(0, 5, [
            {x: 0, y: 0, edges: [1]},
            {x: 1, y: 0, edges: [0,2]},
            {x: 2, y: 0, edges: [1,3]},
            {x: 3, y: 0, edges: [2,4]},
            {x: 4, y: 0, edges: [3,5]},
            {x: 5, y: 0, edges: [4]},
        ] )
        if (!isBenchmark) console.log(res)
    })
    it("tgraph", () => {
        const res = astar.AStar(0, 5, [
            {x: 0, y: 0, edges: [1,2]},
            {x: 2, y: 2, edges: [3,4]},
            {x: 2, y: -2, edges: [1,4]},
            {x: 6, y: 2, edges: [4,5]},
            {x: 6, y: -2, addlWeight: 10, edges: [5]},
            {x: 8, y: 0, edges: []},
        ] )
        if (!isBenchmark) console.log(res)
    })
})
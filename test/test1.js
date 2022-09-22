var assert = require('assert');
var astar = require("..");
var fs = require("fs")
const benchmark = require("benchmark");
const { AssertionError } = require('assert');
// const { createImageData } = require('canvas')
var PNG = require('pngjs2').PNG;

const bench = new benchmark.Suite;
bench.on('cycle', function(event) {
    console.log(String(event.target));
  })
bench.on("error", () => {
    console.error("ruh roh!");
})

const onek = JSON.parse(fs.readFileSync(__dirname + "/1k.json"))
// uncommented
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
        //if (!isBenchmark) console.log(res)
        assert.deepEqual(res, [0,1,2,3,4,5])
    })
    it("tgraph with weight", () => {
        const res = astar.AStar(0, 5, [
            {x: 0, y: 0, edges: [1,2]},
            {x: 2, y: 2, edges: [3,4]},
            {x: 2, y: -2, edges: [1,4]},
            {x: 6, y: 2, edges: [4,5]},
            {x: 6, y: -2, addlWeight: 10, edges: [5]},
            {x: 8, y: 0, edges: []},
        ] )
        //if (!isBenchmark) console.log(res)
        assert.equal(res.indexOf(4), -1) // cannot contain a 4
    })
})

describe("stress test", () => {
    it("1k", () => {
        astar.AStar(0,999,onek)
    })
})

describe("random", () => {
    it("should generate a random nodes (100 nodes, 10+ connections)", () => {
        const d = astar.randomNodes(100,10)
        assert.equal(d.length, 100)
    })
    it("random graph pathable (100 nodes, 10+ connections)", () => {
        const d = astar.randomNodes(100,10)
        try {
        astar.AStar(0,99,d);
        } catch (e) {
            assert.fail(e)
        }
        
    })
})

describe("generate nodes from image", () => {
    it("should make nodes from node points on image", () => {
        const file = fs.readFileSync(__dirname + '/graystylemap.png');
        //console.log(file)
        const img = new Uint8ClampedArray(file, file.byteOffset, 200 * 200 * 4)//file, file.byteOffset, file.byteLength);
        //console.log(img)
        //const data = createImageData(img, 200, 200)
        //console.log(data);

        const nodes = astar.generateNodes({ data: img, width: 200, height: 200 });
        //console.log(nodes);

        //var img_png = new PNG({width: 200, height: 200});
        //img_png.data = Buffer.from(nodes.i.data);
        //img_png.pack().pipe(fs.createWriteStream('testMap2.png'))

        // const file = fs.readFileSync(__dirname + '/map.svg');
        // console.log(file)
        // const img = new Uint8ClampedArray(file, file.byteOffset, file.byteLength);
        // console.log(img)
    })
})

describe("raycast", () => {
    it("should connect nodes in line.", () => {
        const con = astar.Raycast([
            {x:0,y:0, edges:[]},
            {x:10,y:0, edges:[]}
        ])
        assert.equal(con[0].edges.length, 1)
        assert.equal(con[0].edges[0], 1)
        assert.equal(con[1].edges.length, 1)
        assert.equal(con[1].edges[0], 0)
    })
    it("should connect 2 nodes with a 3rd", ()=>{
        const con = astar.Raycast([
            {x:0,y:0, edges:[]},
            {x:10,y:10, edges:[]}
        ])
        astar.AStar(0,1, con);
    })
    it("raycast negative test", () => {
        const con = astar.Raycast([
            {x: 0, y:0, edges:[]},
            {x: 5, y:0, edges:[]},
            {x: 10, y:0, edges: []},
            {x: 5, y: 5, edges: []},
            {x: 5, y:-10, edges: []}
        ])
        astar.AStar(0,4, con);
    })
})
/*describe('makeGraph', () => {
    it('should make a graph', async () => {
        /*const res = await astar.makeUint8ClampedArray().then(a => {
            return a;
        })
        console.log(res)
        astar.makeNodes()
    })
})*/

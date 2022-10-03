require("source-map-support").install();

afterEach(() => {
    jest.restoreAllMocks()
})

import * as col from "../src/col";
// @todo add tests
// @body: each block (point-point, line-point, etc) should have at least 1 true and 1 false test
// bonus points for edge case tests

describe("collision", () => {
    describe("point", () => {
        describe("point", () => {
            it("should return true when points are touching", () => {
                const one = col.constructNodeEntry(0,[{x: 0, y: 0, edges: []}])
                const two = col.constructNodeEntry(0,[{x:0,y:0,edges:[1]}])
                expect(col.collide(one,two)).toBe(true)
            })
            it("should return false when points are not touching", () => {
                const one = col.constructNodeEntry(0,[{x: 0, y: 0, edges: []}])
                const two = col.constructNodeEntry(0,[{x:5,y:5,edges:[]}])
                expect(col.collide(one,two)).toBe(false)
            })
        })
        describe("line", ()=>{})
        describe("ray",()=>{})
    })
    describe("line", () => {
        describe("point", () => {})
        describe("line", () => {})
        describe("ray", () => {})
    })
    describe("ray", () => {
        describe("point", () => {})
        describe("line", () => {})
        describe("ray", () => {})
    })
})

// add tests for distance too
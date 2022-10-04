require("source-map-support").install();

afterEach(() => {
    jest.restoreAllMocks();
});

import * as col from "../src/col";
// @todo add tests
// @body: each block (point-point, line-point, etc) should have at least 1 true and 1 false test
// bonus points for edge case tests

describe("collision", () => {
    describe("point", () => {
        describe("point", () => {
            it("should return true when points are touching", () => {
                const one = col.constructNodeEntry(0, [
                    { x: 0, y: 0, edges: new Set() },
                ]);
                const two = col.constructNodeEntry(0, [
                    { x: 0, y: 0, edges: new Set([1]) },
                ]);
                expect(col.collide(one, two)).toBeTruthy();
            });
            it("should return false when points are not touching", () => {
                const one = col.constructNodeEntry(0, [
                    { x: 0, y: 0, edges: new Set() },
                ]);
                const two = col.constructNodeEntry(0, [
                    { x: 5, y: 5, edges: new Set() },
                ]);
                expect(col.collide(one, two)).toBeFalsy();
            });
        });
        describe("line", () => {
            it("should return true when the point is on the line", () => {
                const p = col.constructNodeEntry(0, [
                    { x: 0, y: 0, edges: new Set() },
                ]);
                const l = col.constructWallEntry({
                    sx: -5,
                    sy: -5,
                    ex: 5,
                    ey: 5,
                });
                expect(col.collide(p, l)).toBeTruthy();
            });
            it("should return true when the point is one of the endpoints", () => {
                const p = col.constructNodeEntry(0, [
                    { x: -5, y: -5, edges: new Set() },
                ]);
                const l = col.constructWallEntry({
                    sx: -5,
                    sy: -5,
                    ex: 5,
                    ey: 5,
                });
                expect(col.collide(p, l)).toBeTruthy();
            });
            it("should return false when the point isnt on the line", () => {
                const p = col.constructNodeEntry(0, [
                    { x: -5, y: 5, edges: new Set() },
                ]);
                const l = col.constructWallEntry({
                    sx: -5,
                    sy: -5,
                    ex: 5,
                    ey: 5,
                });
                expect(col.collide(p, l)).toBeFalsy();
            });
            it("should return false even when the points are collinear", () => {
                const p = col.constructNodeEntry(0, [
                    { x: -7, y: -7, edges: new Set() },
                ]);
                const l = col.constructWallEntry({
                    sx: -5,
                    sy: -5,
                    ex: 5,
                    ey: 5,
                });
                expect(col.collide(p, l)).toBeFalsy();
            });
            it("0 length lines act like points: false", () => {
                const p = col.constructNodeEntry(0, [
                    { x: -7, y: -7, edges: new Set() },
                ]);
                const l = col.constructWallEntry({
                    sx: -5,
                    sy: -5,
                    ex: -5,
                    ey: -5,
                });
                expect(col.collide(p, l)).toBeFalsy();
            });
            it("0 length lines act line points: true", () => {
                const p = col.constructNodeEntry(0, [
                    { x: -5, y: -5, edges: new Set() },
                ]);
                const l = col.constructWallEntry({
                    sx: -5,
                    sy: -5,
                    ex: -5,
                    ey: -5,
                });
                expect(col.collide(p, l)).toBeTruthy();
            });
        });
        describe("ray", () => {});
    });
    describe("line", () => {
        describe("point", () => {});
        describe("line", () => {
            describe("should return true when lines are overlapping", () => {
                it("perp", () => {
                    const l1 = col.constructWallEntry({
                        sx: -2,
                        sy: -2,
                        ex: -2,
                        ey: 4,
                    });
                    const l2 = col.constructWallEntry({
                        sx: -5,
                        sy: 1,
                        ex: 3,
                        ey: 1,
                    });
                    expect(col.collide(l1, l2)).toBeTruthy();
                });
            });
            describe("should return false when lines dont touch", () => {
                it("perp", () => {
                    const l1 = col.constructWallEntry({
                        sx: -2,
                        sy: -1,
                        ex: -2,
                        ey: 2,
                    });
                    const l2 = col.constructWallEntry({
                        sx: -1,
                        sy: 1,
                        ex: 2,
                        ey: 1,
                    });
                    expect(col.collide(l1, l2)).toBeFalsy();
                });
            });
            it("0 length lines act like points: false", () => {
                const l1 = col.constructWallEntry({
                    sx: -2,
                    sy: -1,
                    ex: -2,
                    ey: -1,
                });
                const l2 = col.constructWallEntry({
                    sx: -2,
                    sy: -5,
                    ex: -2,
                    ey: -5,
                });
                expect(col.collide(l1, l2)).toBeFalsy();
            });
            it("0 length lines act line points: true", () => {
                const l1 = col.constructWallEntry({
                    sx: -2,
                    sy: -1,
                    ex: -2,
                    ey: -1,
                });
                const l2 = col.constructWallEntry({
                    sx: -2,
                    sy: -1,
                    ex: -2,
                    ey: -1,
                });
                expect(col.collide(l1, l2)).toBeTruthy();
            });
            it("parallel", () => {
                const l1 = col.constructWallEntry({
                    sx: 0,
                    sy: 0,
                    ex: 0,
                    ey: 10,
                });
                const l2 = col.constructWallEntry({
                    sx: 5,
                    sy: 0,
                    ex: 5,
                    ey: 10,
                });
                expect(col.collide(l1, l2)).toBeFalsy();
            });
        });
        describe("ray", () => {});
    });
    describe("ray", () => {
        describe("point", () => {});
        describe("line", () => {});
        describe("ray", () => {});
    });
});

// add tests for distance too

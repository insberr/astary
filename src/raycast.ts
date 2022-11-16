import type { Node } from './astar';

import structuredClone from '@ungap/structured-clone';
import { Line, Entry, Point, RayE, NodeE, WallE, fastDist, betterDistance } from './col';
import {
    constructNodeEntry,
    constructWallEntry,
    constructRayEntry,
    collide,
    distance,
    shrinkRay,
    LLI,
} from './col';

function between(t: number, a: number, b: number, inclusive: boolean): boolean {
    var min = Math.min(a, b),
        max = Math.max(a, b);

    return inclusive ? t >= min && t <= max : t > min && t < max;
}

function within(t: number, c: number, dist: number): boolean {
    return between(t, c + dist, c - dist, true);
}

function split(line: Line, p: Point): [Line, Line] {
    return [
        { ...line, ex: p.x, ey: p.y },
        { ...line, sx: p.x, sy: p.y },
    ];
}

export enum HookDataType {
    RayConstructed,
    RayHits,
    HitNode,
    HitWall,
    HitRay,
    HitRayNewNode,
    Finished,
}

export type HookBase = {
    type: HookDataType;
    entries: Entry[];
    info: string;
};

export type HookDataRayConstructed = HookBase & {
    type: HookDataType.RayConstructed;
    ray: RayE;
};

export type HookDataRayHits = HookBase & {
    type: HookDataType.RayHits;
    ray: RayE;
    hits: Entry[];
};

export type HookDataHitNode = HookBase & {
    type: HookDataType.HitNode;
    ray: RayE;
    hit: Entry;
};

export type HookDataHitWall = HookBase & {
    type: HookDataType.HitWall;
    ray: RayE;
    hit: Entry;
    distance: number;
    collisionPos: Point;
};

export type HookDataHitRay = HookBase & {
    type: HookDataType.HitRay;
    ray: RayE;
    hit: Entry;
    distance: number;
    collisionPos: Point;
};

export type HookDataHitRayNewNode = HookBase & {
    type: HookDataType.HitRayNewNode;
    ray: RayE;
    newNode: Node;
    hit: Entry;
    distance: number;
    collisionPos: Point;
};

export type HookDataFinished = {
    type: HookDataType.Finished;
    info: string;
    entries: Entry[];
};

export type HookData =
    | HookDataRayConstructed
    | HookDataRayHits
    | HookDataHitNode
    | HookDataHitWall
    | HookDataHitRay
    | HookDataHitRayNewNode
    | HookDataFinished;
// pain

export type Direction = {
    x: number;
    y: number;
};
export enum HitType {
    NewNode,
    NewWall,
    LineSegment,
    LineRay,
}
export type LineRay_Hit = {
    type: HitType;
    object: NewNode | NewWall | LineSegment | LineRay;
    distance: number;
    collisionPos: Point;
};
export type LineRay = {
    s: Point;
    e: Point;
    referenceNode: NewNode;
    direction: Direction;
    hits: LineRay_Hit[];
    used?: boolean;
};

export type NewWall = {
    s: Point;
    e: Point;
};
export type LineSegment = {
    s: Point;
    e: Point;
};
export type NewNode = {
    x: number;
    y: number;
    createdByRaycast?: boolean;
    edges: {
        [key: number]: Set<number>;
    };
    weight?: number;
};

export function findWithHeight(nodes: NewNode[], walls: NewWall[]): [number, number] {
    const copyNodes = structuredClone(nodes);
    const copyWalls = structuredClone(walls);

    // start with x values (width)
    copyNodes.sort((a, b) => b.x - a.x);
    const width1 = copyNodes[0].x;
    copyWalls.sort((a, b) => b.s.x - a.s.x);
    const width2 = copyWalls[0].s.x;
    copyWalls.sort((a, b) => b.e.x - a.e.x);
    const width3 = copyWalls[0].e.x;

    // then y values (height)
    copyNodes.sort((a, b) => b.y - a.y);
    const height1 = copyNodes[0].y;
    copyWalls.sort((a, b) => b.s.y - a.s.y);
    const height2 = copyWalls[0].s.y;
    copyWalls.sort((a, b) => b.e.y - a.e.y);
    const height3 = copyWalls[0].e.y;

    const width = Math.max(width1, width2, width3);
    const height = Math.max(height1, height2, height3);

    return [width, height];
}

export function createPointsAtRayLineIntersections(
    rays: LineRay[],
    nodes: NewNode[],
    walls: NewWall[],
    margin: number,
    maxConnections: number
): NewNode[] {
    // add parrell ray ray collide detection too (when ray goes over ray) idk
    // - do not create a new node if theres already on there.
    // -- maybe also could specify a "do not create a new node if its within x distance from another node".
    // dont forget about walls pain -- Already taken care of

    /* actually just create the rays while making the nodes lol */
    // once thats done;
    // create rays in all specified directions for only the new nodes, (thats why we needed to keep them in a seperate new value), store those rays with the other rays.

    // when a node is created, add it to the hits of both rays
    for (const ray of rays) {
        if (ray.used) continue;
        const raysHit: { ray: LineRay; collisionPos: Point }[] = [];
        for (const r of rays) {
            // if (r.used) continue;
            // ! change this to box collision for margin
            if (r.referenceNode === ray.referenceNode) continue;
            const p = findLineSegmentsIntersect({ s: r.s, e: r.e }, { s: ray.s, e: ray.e });
            if (!p) continue;
            raysHit.push({ ray: r, collisionPos: p });
        }

        if (raysHit.length === 0) continue;
        let connectionsMade = 0;
        for (const hitRay of raysHit) {
            if (maxConnections !== -1 && connectionsMade >= maxConnections) break;
            const hitP = hitRay.collisionPos;
            const hitR = hitRay.ray;

            const newNode = {
                x: +hitP.x.toPrecision(4),
                y: +hitP.y.toPrecision(4),
                createdByRaycast: true,
                edges: {},
                weight: 0,
            };

            if (ray.referenceNode.x === newNode.x && ray.referenceNode.y === newNode.y) continue;
            if (nodes.find((n) => n.x === newNode.x && n.y === newNode.y) !== undefined) continue;

            connectionsMade++;
            nodes.push(newNode);

            ray.hits.push({
                type: HitType.NewNode,
                object: newNode,
                distance: Math.sqrt(Math.pow(ray.s.x - hitP.x, 2) + Math.pow(ray.s.y - hitP.y, 2)),
                collisionPos: hitP,
            });

            hitR.hits.push({
                type: HitType.NewNode,
                object: newNode,
                distance: Math.sqrt(
                    Math.pow(hitR.s.x - hitP.x, 2) + Math.pow(hitR.s.y - hitP.y, 2)
                ),
                collisionPos: hitP,
            });

            // hitR.used = true;
            // ray.used = true;
        }
    }
    return nodes;
}

export function isPointOnLineSegment(line: LineSegment | LineRay, point: Point): boolean {
    // Find the distance between the start and end point of the line
    // then find the distance between the point and the start point of the line
    // then find the distance between the point and the end point of the line

    // if the sum of the distances do not add up to the length of the line,
    // it is impossible for the point to be on the line

    const distLineStartEnd = Math.sqrt(
        Math.pow(line.e.x - line.s.x, 2) + Math.pow(line.e.y - line.s.y, 2)
    );
    const distPointStart = Math.sqrt(
        Math.pow(point.x - line.s.x, 2) + Math.pow(point.y - line.s.y, 2)
    );
    const distPointEnd = Math.sqrt(
        Math.pow(point.x - line.e.x, 2) + Math.pow(point.y - line.e.y, 2)
    );

    return distPointStart + distPointEnd === distLineStartEnd;
}

export function findLineSegmentsIntersect(line1: LineSegment, line2: LineSegment): Point | null {
    const llifn = LLI(
        { sx: line1.s.x, sy: line1.s.y, ex: line1.e.x, ey: line1.e.y },
        { sx: line2.s.x, sy: line2.s.y, ex: line2.e.x, ey: line2.e.y }
    );

    if (llifn === false) return null;
    return { x: llifn.x, y: llifn.y };

    const point1 = line1.s;
    const point2 = line1.e;
    const point3 = line2.s;
    const point4 = line2.e;

    const s =
        ((point4.x - point3.x) * (point1.y - point3.y) -
            (point4.y - point3.y) * (point1.x - point3.x)) /
        ((point4.y - point3.y) * (point2.x - point1.x) -
            (point4.x - point3.x) * (point2.y - point1.y));

    const x = point1.x + s * (point2.x - point1.x);
    const y = point1.y + s * (point2.y - point1.y);
    if (isNaN(x) || isNaN(y)) {
        // console.log('NaN was returned for x or y in lines intersect ', { x, y });
        return null;
    }

    return { x, y };
}

export function findLineHitGraphEdgePoint(
    startPoint: Point,
    direction: Direction,
    width: number,
    height: number
): Point {
    const { x: dx, y: dy } = direction;
    const { x: sx, y: sy } = startPoint;

    if (dx === 0 && dy === 0) {
        throw new Error('Direction cannot be 0,0');
    }
    if ((dy === -1 && dx <= 1 && dx >= -1) || (dy === 1 && dx <= 1 && dx >= -1)) {
        // vertical line
        return { x: sx, y: dy === -1 ? height : 0 };
    }
    if ((dx === -1 && dy <= 1 && dy >= -1) || (dx === 1 && dy <= 1 && dy >= -1)) {
        // horizontal line
        return { x: dx === 1 ? width : 0, y: sy };
    }
    if (dx === dy) {
        // diagonal line
        // find x for a given y value
        const x = (height - sy) / dy + sx;
        // console.log(x, height);
        if (x > width) {
            // find y for a given x value
            const y = (width - sx) / dx + sy;
            // console.warn(width, y);
            if (y > height) {
                throw new Error('findLineHitGraphEdgePoint: y > height');
            }
            return { x: width, y };
        }
        return x > width ? { x: width, y: sy + (width - sx) * dy } : { x, y: height };
    } else if (dx === -dy) {
        console.log('does this really run?');
        // diagonal line
        // find x for a given y value
        const x = sy / dy + sx;
        if (x > width) {
            // find y for a given x value
            const y = (width - sx) / dx + sy;
            if (y > height) {
                throw new Error('findLineHitGraphEdgePoint: y > height');
            }
            return { x: width, y };
        }
        return x > width ? { x: width, y: sy + (width - sx) * dy } : { x, y: 0 };
    } else {
        // opposite diagonal line
        // find x for a given y value
        const x = sy / dy + sx;
        if (x > width) {
            // find y for a given x value
            // const y = (width - sx) / dx + sy;
            const temp_line = { sx: width, sy: 0, ex: width, ey: height };
            const intersect = LLI({ sx, sy, ex: x, ey: 0 }, temp_line);
            // if (y > height) {
            //     console.log(
            //         new Error('findLineHitGraphEdgePoint: y > height'),
            //         { x, y },
            //         { dx, dy }
            //     );
            //     // return { x: width, y: height };
            // }
            if (intersect === false) {
                throw new Error('findLineHitGraphEdgePoint: intersect === false');
            }
            return { x: width, y: intersect.y };
            // return y > height ? { x: sx + (height - sy) * dx, y: height } : { x: width, y };
        }
        return x > width ? { x: width, y: sy + (width - sx) * dy } : { x, y: 0 };
    }
    // return { x: -1, y: -1 };
}

function createLineRays(
    nodes: NewNode[],
    walls: NewWall[],
    directions: Direction[],
    margin: number,
    dimensions: { width: number; height: number }
): LineRay[] {
    // maybe here we also put a value for other nodes and walls the ray hits, for later use.

    const rays: LineRay[] = [];
    for (const node of nodes) {
        // maybe add an option for this...
        if (node.createdByRaycast) continue;
        for (const direction of directions) {
            const ray: LineRay = {
                s: { x: node.x, y: node.y },

                // I will have to check this later
                e: findLineHitGraphEdgePoint(
                    { x: node.x, y: node.y },
                    direction,
                    dimensions.width,
                    dimensions.height
                ),

                referenceNode: node,
                direction,
                hits: [],
            };

            for (const wall of walls) {
                const hitPoint: Point | null = findLineSegmentsIntersect(ray, wall);
                if (hitPoint) {
                    ray.hits.push({
                        type: HitType.NewWall,
                        object: wall,
                        distance: Math.sqrt(
                            Math.pow(node.x - hitPoint.x, 2) + Math.pow(node.y - hitPoint.y, 2)
                        ),
                        collisionPos: hitPoint,
                    });
                }
            }

            // make ray until it hits a wall if it hits any
            const wallsHit = ray.hits.filter((hit) => hit.type === HitType.NewWall);
            if (wallsHit.length > 0) {
                const closestWallHit = wallsHit.reduce((prev, current) =>
                    prev.distance < current.distance ? prev : current
                );
                ray.e = closestWallHit.collisionPos;
                ray.hits = [closestWallHit];
            }

            // find the nodes and walls this ray hits
            for (const otherNode of nodes) {
                if (otherNode === node) continue;
                if (isPointOnLineSegment(ray, otherNode)) {
                    ray.hits.push({
                        type: HitType.NewNode,
                        object: otherNode,
                        distance: Math.sqrt(
                            Math.sqrt(
                                Math.pow(node.x - otherNode.x, 2) +
                                    Math.pow(node.y - otherNode.y, 2)
                            )
                        ),
                        collisionPos: { x: otherNode.x, y: otherNode.y },
                    });
                }
            }

            // ray.hits.sort((a, b) => a.distance - b.distance);

            rays.push(ray);
        }
    }
    return rays;
}

export function connectHitNodesAlgorithm(rays: LineRay[], nodes: NewNode[]) {
    const connectedNodes: NewNode[] = [];
    for (const ray of rays) {
        // do connection here
    }
    return connectedNodes;
}

export function Raycast(
    nodes: NewNode[],
    walls: NewWall[],
    options?: {
        _hook?: (data: HookData, nodes?: NewNode[], walls?: NewWall[]) => void;
        margin?: number;
        minDistance?: number;
        directions?: Direction[];
        // including these will speed up the code a bit
        width?: number;
        height?: number;
        // just connect the points, dont create any points where rays collide
        justConnect?: boolean;
        maxConnections?: number;
        rays?: LineRay[];
        forceRayRecreation?: boolean;
    }
): { nodes: NewNode[]; rays: LineRay[] } {
    const directions: Direction[] = options?.directions || [
        { x: 0, y: 1 }, // up
        { x: 0, y: -1 }, // down
        { x: 1, y: 0 }, // right
        { x: -1, y: 0 }, // left
        // { x: 0, y: 2 }, // test: up right
        // { x: -5, y: 1 }, // test: slope
        // { x: 5, y: 5 }, // test: slope
    ];
    // Find the width and height
    const [width, height] =
        options?.width && options?.height
            ? [options.width, options.height]
            : findWithHeight(nodes, walls);

    // all nodes cast rays in all specified directions; store those rays in a new value.
    const rays: LineRay[] =
        options?.rays && options.rays.length > 0
            ? options.rays.map((r) => {
                  r.used = false;
                  return r;
              })
            : createLineRays(nodes, walls, directions, options?.margin || 0, {
                  width: width,
                  height: height,
              });

    // console.dir(rays, { depth: 50 });

    // create nodes at all points where rays intersect, store those nodes in a seperate new value.

    // CURRENTLY CREATES SO MANY EXTRA NODES FOR SOME REASON
    const nodesAtRayIntersections: NewNode[] = createPointsAtRayLineIntersections(
        rays,
        nodes,
        walls,
        options?.margin || 0,
        options?.maxConnections || -1
    );
    // console.log(nodesAtRayIntersections);

    const hitNodesConnected: NewNode[] = connectHitNodesAlgorithm(rays, nodesAtRayIntersections);
    // Create new value thats the original and created points combined.
    const allNodes: NewNode[] = nodes; //nodesAtRayIntersections;

    // For every ray, turn it into a rect (for margin) and get all points inside it.
    // - use point connection algor to connect every point correctly smh
    // done, should solve a lot of problems if its done that way.
    // forgot to include walls damn it. ill update this for walls later
    return { nodes: allNodes, rays: rays };
}

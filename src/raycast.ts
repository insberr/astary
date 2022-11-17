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
export enum NodeEdgeDirectionType {
    Normal,
    opposite,
    Opposite,
}
export type NodeEdge = {
    node: NewNode;
    index: number;
    direction: {
        type: NodeEdgeDirectionType;
        direction: Direction;
    };
};
export type NewNode = {
    x: number;
    y: number;
    createdByRaycast?: boolean;
    edges: {
        indexes: Set<number>;
        datas?: NodeEdge[];
    };
    weight?: number;
};

export function findWithHeight(nodes: NewNode[], walls: NewWall[]): [number, number] {
    const copyNodes = structuredClone(nodes);
    const copyWalls = structuredClone(walls);

    // start with x values (width)
    copyNodes.sort((a, b) => b.x - a.x);
    const width1 = copyNodes[0].x;
    let width2 = 0;
    let width3 = 0;
    if (walls.length > 0) {
        copyWalls.sort((a, b) => b.s.x - a.s.x);
        width2 = copyWalls[0].s.x;
        copyWalls.sort((a, b) => b.e.x - a.e.x);
        width3 = copyWalls[0].e.x;
    }

    // then y values (height)
    copyNodes.sort((a, b) => b.y - a.y);
    const height1 = copyNodes[0].y;
    let height2 = 0;
    let height3 = 0;
    if (walls.length > 0) {
        copyWalls.sort((a, b) => b.s.y - a.s.y);
        height2 = copyWalls[0].s.y;
        copyWalls.sort((a, b) => b.e.y - a.e.y);
        height3 = copyWalls[0].e.y;
    }

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
                edges: {
                    indexes: new Set<number>(),
                    datas: [],
                },
                weight: 0,
            };

            hitR.hits.push({
                type: HitType.NewNode,
                object: newNode,
                distance: Math.sqrt(
                    Math.pow(hitR.s.x - hitP.x, 2) + Math.pow(hitR.s.y - hitP.y, 2)
                ),
                collisionPos: hitP,
            });

            if (ray.referenceNode.x === newNode.x && ray.referenceNode.y === newNode.y) continue;

            ray.hits.push({
                type: HitType.NewNode,
                object: newNode,
                distance: Math.sqrt(Math.pow(ray.s.x - hitP.x, 2) + Math.pow(ray.s.y - hitP.y, 2)),
                collisionPos: hitP,
            });
            // grrrrrrr

            if (nodes.find((n) => n.x === newNode.x && n.y === newNode.y) !== undefined) continue;

            connectionsMade++;
            nodes.push(newNode);

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
    // ! PLEASE DO SOON
    // TODO: NEED TO ADD POINT ON LINE TEST TO LINE LINE INTERSECT SO WE CAN GET PARARELL LINES ON TOP OF EACH OTHER
    // TODO: PLESASE DO ABLOVE SOON :TM:
    // TODO: DO IT VERY SOON
    // ! LIKE ITS URGENT

    // * Lets try this
    // ======= Credit To https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
    // Javascript program to check if two given line segments intersect

    // Given three collinear points p, q, r, the function checks if
    // point q lies on line segment 'pr'
    function onSegment(p, q, r) {
        if (
            q.x <= Math.max(p.x, r.x) &&
            q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) &&
            q.y >= Math.min(p.y, r.y)
        )
            return true;

        return false;
    }

    // To find orientation of ordered triplet (p, q, r).
    // The function returns following values
    // 0 --> p, q and r are collinear
    // 1 --> Clockwise
    // 2 --> Counterclockwise
    function orientation(p, q, r) {
        // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
        // for details of below formula.
        let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

        if (val == 0) return 0; // collinear

        return val > 0 ? 1 : 2; // clock or counterclock wise
    }

    const llifn = LLI(
        { sx: line1.s.x, sy: line1.s.y, ex: line1.e.x, ey: line1.e.y },
        { sx: line2.s.x, sy: line2.s.y, ex: line2.e.x, ey: line2.e.y }
    );

    if (llifn === false) {
        return null;
    }
    return llifn; // Doesn't fall in any of the above cases

    // This code is contributed by avanitrachhadiya2155
    // ======= End

    // const llifn = LLI(
    //     { sx: line1.s.x, sy: line1.s.y, ex: line1.e.x, ey: line1.e.y },
    //     { sx: line2.s.x, sy: line2.s.y, ex: line2.e.x, ey: line2.e.y }
    // );

    // if (llifn === false) {
    //     // might need to add line 1 too?
    //     // const s2 = isPointOnLineSegment(line1, line2.s);
    //     // const e2 = isPointOnLineSegment(line1, line2.e);
    //     // const s1 = isPointOnLineSegment(line2, line1.s);
    //     // const e1 = isPointOnLineSegment(line2, line1.e);
    //     // console.log(`s2: ${s2}, e2: ${e2}\ns1: ${s1}, e1: ${e1}`);
    //     // if (s2) {
    //     //     return line2.s;
    //     // }
    //     // if (e2) {
    //     //     return line2.e;
    //     // }
    //     // if (s1) {
    //     //     return line1.s;
    //     // }
    //     // if (e1) {
    //     //     return line1.e;
    //     // }

    //     return null;
    // }
    // return { x: llifn.x, y: llifn.y };
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
            // const wallsHit = ray.hits.filter((hit) => hit.type === HitType.NewWall);
            let closestWallHit: LineRay_Hit | null = null;
            if (ray.hits.length > 0) {
                closestWallHit = ray.hits.reduce((prev, current) =>
                    prev.distance < current.distance ? prev : current
                );
                ray.e = closestWallHit.collisionPos;
                ray.hits = [closestWallHit];
            }

            // find the nodes ray hits
            for (const otherNode of nodes) {
                if (otherNode === node) continue;
                // I LEFT OFF HERE AND DID STUFF REMEMBER !!!!!!!!!!!
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

            const nodesHit = ray.hits.filter((hit) => hit.type === HitType.NewNode);
            if (nodesHit.length > 0) {
                const closestNodeHit = nodesHit.reduce((prev, current) =>
                    prev.distance < current.distance ? prev : current
                );
                ray.e = closestNodeHit.collisionPos;
                if (closestWallHit === null || closestWallHit.distance > closestNodeHit.distance) {
                    ray.hits = [closestNodeHit];
                    ray.e = closestNodeHit.collisionPos;
                } else if (closestWallHit.distance < closestNodeHit.distance) {
                    ray.hits = [closestWallHit, closestNodeHit];
                }
            }

            // ray.hits.sort((a, b) => a.distance - b.distance);

            rays.push(ray);
        }
    }
    if (rays.length * directions.length !== nodes.length * directions.length) {
        console.log(
            'createLineRays: rays.length * directions.length !== nodes.length * directions.length',
            nodes,
            rays
        );
    }
    return rays;
}

export function connectHitNodesAlgorithm(
    rays: LineRay[],
    nodes: NewNode[],
    directions: Direction[]
) {
    for (const ray of rays) {
        const hitNodes: LineRay_Hit[] = ray.hits.filter((hit) => hit.type === HitType.NewNode);
        hitNodes.sort((a, b) => a.distance - b.distance);

        if (hitNodes.length === 0) continue;
        const refI = nodes.indexOf(ray.referenceNode);
        console.log(ray, refI, hitNodes);
        let lastNode = ray.referenceNode;
        for (const [index, hit] of hitNodes.entries()) {
            if (refI === 4) {
                console.log(hit);
            }
            // ADD CHECK TO MAKE STOP IF IT HITS A NON RAYCASTED NODE (CONNECT TO IT BUT STOP AFTER)
            const nodesIndex = nodes.indexOf(hit.object as NewNode);
            const lastNodeIndex = nodes.indexOf(lastNode);
            // const rayDirectionIndex = directions.indexOf(ray.direction);
            if (nodesIndex === -1) {
                throw new Error(
                    'Hit node does not exist in nodes array. Not sure how this would happen.'
                );
            }

            // only does the first hit pain

            // ray.referenceNode.edges.datas.push({
            //     node: nodes[nodesIndex],
            //     index: nodesIndex,
            //     direction: {
            //         type: NodeEdgeDirectionType.Normal,
            //         direction: directions[rayDirectionIndex],
            //     },
            // });
            lastNode.edges.indexes.add(nodesIndex);

            // (hit.object as NewNode).edges.datas.push({
            //     node: nodes[rayRefNodeIndex],
            //     index: rayRefNodeIndex,
            //     direction: {
            //         type: NodeEdgeDirectionType.Opposite,
            //         direction: directions[rayDirectionIndex],
            //     },
            // });
            (hit.object as NewNode).edges.indexes.add(lastNodeIndex);
            lastNode = hit.object as NewNode;
        }
    }
    return nodes;
}

export function Raycast(
    nodes: NewNode[],
    walls: NewWall[],
    options?: {
        hook?: (data: HookData, nodes?: NewNode[], walls?: NewWall[]) => void;
        margin?: number;

        // the minimum distance that a node can be from another
        // might jus tend up being the same as margin by default
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

    const hitNodesConnected: NewNode[] = connectHitNodesAlgorithm(
        rays,
        nodesAtRayIntersections,
        directions
    );
    // Create new value thats the original and created points combined.
    const allNodes: NewNode[] = nodes; //nodesAtRayIntersections;

    // For every ray, turn it into a rect (for margin) and get all points inside it.
    // - use point connection algor to connect every point correctly smh
    // done, should solve a lot of problems if its done that way.
    // forgot to include walls damn it. ill update this for walls later
    return { nodes: allNodes, rays: rays };
}

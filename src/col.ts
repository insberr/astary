import type { Node } from './astar';
export type Line = {
    sx: number;
    sy: number;
    ex: number;
    ey: number;
};
// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
): false | { x: number; y: number } {
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return x1 == x3 && x2 == x4 && y1 == y3 && y2 == y4 ? { x: x1, y: y1 } : false;
    }

    const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    // Lines are parallel
    if (denominator === 0) {
        return false;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false;
    }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1);
    let y = y1 + ua * (y2 - y1);

    return { x, y };
}

export function LLI(l1: Line, l2: Line) {
    return intersect(l1.sx, l1.sy, l1.ex, l1.ey, l2.sx, l2.sy, l2.ex, l2.ey);
}
export function fastDist(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}
function pointLineDist(x: number, y: number, l: Line) {
    function sqr(x: number) {
        return x * x;
    }
    function dist2(v: Point, w: Point) {
        return sqr(v.x - w.x) + sqr(v.y - w.y);
    }
    function distToSegmentSquared(p: Point, v: Point, w: Point) {
        var l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
    }
    return Math.sqrt(distToSegmentSquared({ x, y }, getPoints(l)[0], getPoints(l)[1]));
}

function reduceEnd(line: Line, r: number) {
    var dx = line.ex - line.sx;
    var dy = line.ey - line.sy;
    // if (isNaN(dx)) { console.log(line); dx = 0; }
    // if (isNaN(dy)) { console.log(line); dy = 0; }
    var mag = Math.hypot(dx, dy);
    return {
        x: line.ex - (r * dx) / mag,
        y: line.ey - (r * dy) / mag,
    };
}

function getPoints(line: Line): [Point, Point] {
    return [
        { x: line.sx, y: line.sy },
        { x: line.ex, y: line.ey },
    ];
}

function calcIsInsideLineSegment(line: Line, pnt: Point): boolean {
    if (line.sx == line.ex && line.ey == line.sy) {
        return line.sx == pnt.x && line.sy == pnt.y;
    }
    const c = pnt;
    const [a, b] = getPoints(line);
    const crossproduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);

    // compare versus epsilon for floating point values, or != 0 if using integers
    if (Math.abs(crossproduct) > Number.EPSILON) {
        return false;
    }

    const dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
    if (dotproduct < 0) {
        return false;
    }

    const squaredlengthba = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
    if (dotproduct > squaredlengthba) {
        return false;
    }

    return true;
}

//#region Entry code

export type Entry = NodeE | WallE | RayE;

export type NodeE = {
    t: 'node';
    ref: number;
    c: Point;
};
export type WallE = {
    t: 'wall';
    ref: Line;
};
export type RayE = {
    t: 'ray';
    ref: number;
    l: Line;
};
export type Point = {
    x: number;
    y: number;
};
export function distance(entry: Entry, p: Point): number {
    if (entry.t == 'node') {
        return fastDist(entry.c.x, entry.c.y, p.x, p.y);
    } else if (entry.t == 'wall') {
        return pointLineDist(p.x, p.y, entry.ref);
    } else if (entry.t == 'ray') {
        return pointLineDist(p.x, p.y, entry.l);
    } else {
        throw new Error('Unknown entry: ' + entry);
    }
}

export function collide(entry1: Entry, entry2: Entry): boolean {
    // This function could probably be optimized but idgaf
    if (entry1.t == 'node') {
        if (entry2.t == 'node') {
            // Node Node Colision
            return entry1.c.x == entry2.c.x && entry1.c.y == entry2.c.y;
        } else if (entry2.t == 'ray') {
            return calcIsInsideLineSegment(entry2.l, entry1.c);
        } else if (entry2.t == 'wall') {
            return calcIsInsideLineSegment(entry2.ref, entry1.c);
        }
    } else if (entry1.t == 'wall') {
        if (entry2.t == 'node') {
            return calcIsInsideLineSegment(entry1.ref, entry2.c);
        } else if (entry2.t == 'wall') {
            return LLI(entry1.ref, entry2.ref) ? true : false;
        } else if (entry2.t == 'ray') {
            return LLI(entry1.ref, entry2.l) ? true : false;
        }
    } else if (entry1.t == 'ray') {
        if (entry2.t == 'node') {
            return calcIsInsideLineSegment(entry1.l, entry2.c);
        } else if (entry2.t == 'wall') {
            return LLI(entry1.l, entry2.ref) ? true : false;
        } else if (entry2.t == 'ray') {
            return LLI(entry1.l, entry2.l) ? true : false;
        }
    }

    throw new Error('Failed to compare ' + entry1.t + ' and ' + entry2.t);
}

export function constructNodeEntry(nid: number, nodes: Node[]): NodeE {
    return {
        t: 'node',
        ref: nid,
        c: nodes[nid],
    };
}

export function constructWallEntry(wall: Line): WallE {
    return {
        t: 'wall',
        ref: wall,
    };
}

export function constructRayEntry(nid: number, nodes: Node[], dest: Point): RayE {
    if (nid === 50) console.log(nodes[nid], dest);
    const d = nodes[nid];
    //console.log(d)
    return {
        t: 'ray',
        ref: nid,
        l: { sx: d.x, sy: d.y, ex: dest.x, ey: dest.y },
    };
}

export function setRayEnd(entry: RayE, end: Point): RayE {
    return {
        ...entry,
        l: {
            ...entry.l,
            ex: end.x,
            ey: end.y,
        },
    };
}
export function shrinkRay(ray: RayE, amt: number): RayE {
    const sPoint = reduceEnd(ray.l, amt);
    return setRayEnd(ray, sPoint);
}
//#endregion

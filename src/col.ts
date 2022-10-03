import type { Node } from "./astar";
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
    return false;
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
function fastDist(x1: number, y1: number, x2: number, y2: number) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1)
}
function pointLineDist(x: number, y: number, l: Line) {
  const ax1 = l.sx;
  const ay1 = l.sy;
  const ax2 = l.ex;
  const ay2 = l.ey;
  return (
    (x * (ay2 - ay1) - y * (ax2 - ax1) + ax2 * ay1 - ay2 * ax1) /
    Math.sqrt(((ay2 - ay1) ^ 2) + ((ax2 - ax1) ^ 2))
  );
}
/*
function nodeConnectionStyle(
  indl: number,
  colLines: { l: Line; ref: number }[],
  l: { l: Line; ref: number },
  col: boolean | { x: number; y: number },
  nodes: Node[],
  dpointLine: Line,
  enable: (number | string)[]
) {
  if (enable.length === 0) {
    console.log("Did you mean to leave the node connection style as none?");
    return colLines;
  }
  if (enable.includes(1) || enable.includes("splice")) colLines.splice(indl, 1);
  if (col === false) return colLines;
  if (col === true) {
    console.log(
      "col returned true in nodeConnectionStyle: This should not happen. EVER"
    );
    return colLines;
  }
  if (enable.includes(2) || enable.includes("l"))
    colLines.push({
      l: { ...l.l, ex: col.x, ey: col.y },
      ref: nodes.length - 1,
    });
  if (enable.includes(3) || enable.includes("dpoint"))
    colLines.push({
      l: { ...dpointLine, ex: col.x, ey: col.y },
      ref: nodes.length - 1,
    });
  return colLines;
}*/

function reduceEnd(line: Line, r: number) {
  var dx = line.ex - line.sx;
  var dy = line.ey - line.sy;
  var mag = Math.hypot(dx, dy);
  return {
    x: line.ex - (r * dx) / mag,
    y: line.ey - (r * dy) / mag,
  };
}
/*unction calcIsInsideLineSegment(line1, line2, pnt) {
  var L2 = ( ((line2.x - line1.x) * (line2.x - line1.x)) + ((line2.y - line1.y) * (line2.y - line1.y)) );
  if(L2 == 0) return false;
  var r = ( ((pnt.x - line1.x) * (line2.x - line1.x)) + ((pnt.y - line1.y) * (line2.y - line1.y)) ) / L2;
  return (0 <= r) && (r <= 1);
}*/

function getPoints(line: Line): [Point, Point] {
  return [
    { x: line.sx, y: line.sy },
    { x: line.ex, y: line.ey },
  ];
}

function calcIsInsideLineSegment(line: Line, pnt: Point): boolean {
  const c = pnt;
  const [a, b] = getPoints(line);
  const crossproduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y)

  // compare versus epsilon for floating point values, or != 0 if using integers
  if (Math.abs(crossproduct) > Number.EPSILON) {
    return false
  }

  const dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)
  if (dotproduct < 0) {
    return false
  }

  const squaredlengthba = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
  if (dotproduct > squaredlengthba) {
    return false
  }

  return true
}

//#region Entry code


export type Entry = NodeE | WallE | RayE

export type NodeE = {
  t: "node",
  ref: number
  c: Point
}
export type WallE = {
  t: "wall",
  ref: Line
}
export type RayE = {
  t: "ray",
  ref: number,
  l: Line
}
export type Point = {
  x: number
  y: number
}
export function distance(entry: Entry, p: Point): number {
  if (entry.t == "node") {
    return fastDist(entry.c.x, entry.c.y, p.x, p.y)
  }
  else if (entry.t == "wall") {
    return pointLineDist(p.x, p.y, entry.ref)
  }
  else if (entry.t == "ray") {
    return pointLineDist(p.x, p.y, entry.l);
  } else {
    throw new Error("Unknown entry: " + entry)
  }
}

export function collide(entry1: Entry, entry2: Entry): boolean {
  // This function could probably be optimized but idgaf
  if (entry1.t == "node") {
    if (entry2.t == "node") {
      // Node Node Colision
      return (entry1.c.x == entry2.c.x && entry1.c.y == entry2.c.y)
    }
    else if (entry2.t == "ray") {
      return calcIsInsideLineSegment(entry2.l, entry1.c)
    }
    else if (entry2.t == "wall") {
      return calcIsInsideLineSegment(entry2.ref, entry1.c)
    }
  }
  else if (entry1.t == "wall") {
    if (entry2.t == "node") {
      return calcIsInsideLineSegment(entry1.ref, entry2.c)
    }
    else if (entry2.t == "wall") {
      return LLI(entry1.ref, entry2.ref) ? true : false
    }
    else if (entry2.t == "ray") {
      return LLI(entry1.ref, entry2.l) ? true : false
    }
  }
  else if (entry1.t == "ray") {
    if (entry2.t == "node") {
      return calcIsInsideLineSegment(entry1.l, entry2.c)
    }
    else if (entry2.t == "wall") {
      return LLI(entry1.l, entry2.ref) ? true : false
    }
    else if (entry2.t == "ray") {
      return LLI(entry1.l, entry2.l) ? true : false
    }
  }

  throw new Error("Failed to compare " + entry1.t + " and " + entry2.t)
}

export function constructNodeEntry(nid: number, nodes: Node[]): NodeE {
  return {
    t: "node",
    ref: nid,
    c: nodes[nid]
  }
}

export function constructWallEntry(wall: Line): WallE {
  return {
    t: "wall",
    ref: wall
  }
}

export function constructRayEntry(nid: number, nodes: Node[], dest: Point): RayE {
  const d = nodes[nid]
  return {
    t: "ray",
    ref: nid,
    l: { sx: d.x, sy: d.y, ex: dest.x, ey: dest.y }
  }
}

export function setRayEnd(entry: RayE, end: Point): RayE {
  return {
    ...entry,
    l: {
      ...entry.l,
      ex: end.x,
      ey: end.y
    }
  }
}
export function shrinkRay(ray: RayE, amt: number): RayE {
  const sPoint = reduceEnd(ray.l, amt)
  return setRayEnd(ray, sPoint)
}
  //#endregion
import type { Node } from "./astar";
import {Line, Entry, Point, RayE, NodeE, WallE, fastDist} from "./col"
import { constructNodeEntry, constructWallEntry, constructRayEntry, collide, distance, shrinkRay, LLI } from "./col";


export enum HookDataType {
    RayConstructed,
    RayHits,
    HitNode,
    HitWall,
    HitRay,
    HitRayNewNode,
    Finished
}
export type HookBase = {
    type: HookDataType,
    node: Node,
    edge: Point,
    entries: Entry[],
    ray: RayE,
    info: string
}
export type HookDataRayConstructed = HookBase & {
  type: HookDataType.RayConstructed
};
export type HookDataRayHits = HookBase & {
    type: HookDataType.RayHits
    hits: Entry[],
}
export type HookDataHitNode = HookBase & {
    type: HookDataType.HitNode
    hits: Entry[],
    hit: Entry,
}
export type HookDataHitWall = HookBase & {
    type: HookDataType.HitWall
    hits: Entry[],
    hit: Entry,
    distance: number,
    collisionPos: Point | boolean,
}
export type HookDataHitRay = HookBase & {
    type: HookDataType.HitRay
    hits: Entry[],
    hit: Entry,
    distance: number,
    collisionPos: Point,
}
export type HookDataHitRayNewNode = HookBase & {
    type: HookDataType.HitRayNewNode
    newNode: Node,
    hits: Entry[],
    hit: Entry,
    distance: number,
    collisionPos: Point,
}
export type HookDataFinished = {
    type: HookDataType.Finished,
    info: string,
    entries: Entry[],
}
export type HookData = HookDataRayConstructed | HookDataRayHits | HookDataHitNode | HookDataHitWall | HookDataHitRay | HookDataHitRayNewNode | HookDataFinished;

export function Raycast(nodes: Node[], walls: Line[], _hook?: (nodes: Node[], walls: Line[], data: HookData) => void) {
  // setup
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  walls.forEach((w) => {
    xs.push(w.ex, w.sx);
    ys.push(w.ey, w.sy);
  });
  const minX = Math.min.apply(null, xs);
  const maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys);
  const maxY = Math.max.apply(null, ys);
  const entries: Entry[] = [];
  nodes.forEach((node,i) => {
    entries.push(constructNodeEntry(i,nodes))
  })
  walls.forEach((wall) => {
    entries.push(constructWallEntry(wall))
  })
  // raycast time
  nodes.forEach((node, i) => {
    // edges of the map
    const edges: Point[] = [
      { x: node.x, y: minY },
      { x: node.x, y: maxY },
      { x: minX,   y: node.y },
      { x: maxX,   y: node.y },
    ];
    edges.forEach((n) => {
      const ray = constructRayEntry(i,nodes,n)
      if (ray.l.sx == ray.l.ex && ray.l.sy == ray.l.ey) {
        return;
      }
      
        if (_hook) _hook([...nodes], [...walls],  {
            type: HookDataType.RayConstructed,
            node: node,
            edge: n,
            entries: [...entries],
            ray: ray,
            info: 'edges.forEach => ray constructed'
        })

      // begin absolute chonker of a line
      const hits = entries.filter((e) => e.ref != i && collide(ray,e)).sort((a,b) => distance(a, node) - distance(b, node))
      if (hits[0]?.ref == i) {
        hits.shift()
      }
      if (_hook) _hook([...nodes], [...walls], {
        type: HookDataType.RayHits,
        node: {...node},
        edge: {...n},
        entries: [...entries],
        hits: hits,
        ray: ray,
        info: 'edges.forEach => hits calculated'
      })

      // end absolute chonker of a line
      if (hits.length == 0) {
        entries.push(ray) // we dont hit anything
        return
      }
      const hit = hits[0]
      // we HIT SOMETHING!!
      switch (hit.t) {
        case "node": 
        // idk you finish adding hooks
        if (_hook) _hook([...nodes], [...walls], {
            type: HookDataType.HitNode,
            node: {...node},
            edge: {...n},
            entries: [...entries],
            hits: [...hits],
            ray: ray,
            hit: Object.assign({}, hit),
            info: 'edges.forEach => we hit a node'
        })

          // we hit a node
          const hid = hit.ref
          if (nodes[i].edges.includes(hid)) {
            break;
          }
          nodes[hid].edges.push(i)
          nodes[i].edges.push(hid)
          entries.push(shrinkRay(constructRayEntry(i,nodes, hit.c),0.001))
          break;
        case "wall":
          const hitpos = LLI(hit.ref,ray.l)
            if (_hook) _hook([...nodes], [...walls], {
                type: HookDataType.HitWall,
                node: {...node},
                edge: {...n},
                entries: [...entries],
                hits: [...hits],
                ray: ray,
                hit: Object.assign({}, hit),
                distance: distance(hit, node),
                collisionPos: hitpos,
                info: 'edges.forEach => we hit a wall'
            })
          if (!hitpos) {
            throw new Error("This shouldnt be possible and is a bug")
          }
          entries.push(shrinkRay(constructRayEntry(i,nodes, hitpos),0.001))
          // we hit a wall
          break;
        case "ray":
            // we hit a ray
            if (ray.ref == hit.ref) {
                break;
            }
            // ray collision pos
            const rayCollidePos = LLI(hit.l,ray.l)
            //console.log(hit, ray.l, LLI(hit.l, ray.l))
            //console.log(rayCollidePos)
            if (!rayCollidePos) {
              throw new Error("This shouldnt be possible and is a bug")
            }
            if (_hook) _hook([...nodes], [...walls], {
              type: HookDataType.HitRay,
              node: {...node},
              edge: {...n},
              entries: [...entries],
              hits: [...hits],
              ray: ray,
              hit: Object.assign({}, hit),
              distance: distance(hit, node),
              collisionPos: rayCollidePos,
              info: "edges.forEach => we hit a ray"
            })
            // create new entry for such line
            entries.push(shrinkRay(constructRayEntry(i,nodes, rayCollidePos), 0.001))
            // create a node at the collision, with entries for the nodes it connects to
            // IDFK
            const newNodeIndex = nodes.push({ x: rayCollidePos.x, y: rayCollidePos.y, raycast: true, edges: [i, ray.ref, hit.ref] })
            entries.push(constructNodeEntry(newNodeIndex - 1, nodes))
            if (_hook) _hook([...nodes], [...walls], {
              type: HookDataType.HitRayNewNode,
              node: {...node},
              edge: {...n},
              entries: [...entries],
              hits: [...hits],
              newNode: nodes[newNodeIndex - 1],
              ray: ray,
              info: "edges.forEach => we hit a ray, new node created",
              hit: Object.assign({}, hit),
              distance: distance(hit, node),
              collisionPos: rayCollidePos,
            })
            nodes[i].edges.push(newNodeIndex - 1)
            nodes[ray.ref].edges.push(newNodeIndex - 1)
            nodes[hit.ref].edges.push(newNodeIndex - 1)
          break;
      }
    })
  })
  if (_hook) _hook([...nodes], [...walls], { type: HookDataType.Finished, info: 'finished', entries: [...entries] })
  return nodes;
}

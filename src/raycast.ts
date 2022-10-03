import type { Node } from "./astar";
import type {Line, Entry, Point, RayE} from "./col"
import { constructNodeEntry, constructWallEntry, constructRayEntry, collide, distance, shrinkRay, LLI } from "./col";

export function Raycast(nodes: Node[], walls: Line[], _hook?: (nodes: Node[], walls: Line[], entries: Entry[], hits: Entry[] | null, edge: Point, anyLine: Line | null, ray: RayE | null, info: string) => void) {
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
    if (node.raycast) {
      return;
    }
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
      
      if (_hook) _hook(nodes, walls, entries, null, n, null, ray, 'edges.forEach => ray constructed')

      // begin absolute chonker of a line
      const hits = entries.filter((e) => collide(ray,e)).sort((a,b) => distance(a, node) - distance(b, node))
      if (_hook) _hook(nodes, walls, entries, hits, n, null, ray, 'edges.forEach => hits calculated')

      // end absolute chonker of a line
      if (hits[0]?.ref == i) {
        hits.shift()
      }
      if (hits.length == 0) {
        entries.push(ray) // we dont hit anything
        return
      }
      const hit = hits[0]
      // we HIT SOMETHING!!
      switch (hit.t) {
        case "node": 
        // idk you finish adding hooks
        // if (_hook) _hook(nodes, walls, entries, hits, n, null, ray, 'edges.forEach => we hit a node')

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
          if (!hitpos) {
            throw new Error("This shouldnt be possible and is a bug")
          }
          entries.push(shrinkRay(constructRayEntry(i,nodes, hitpos),0.001))
          // we hit a wall
          break;
        case "ray":
            /*
            // we hit a ray
            
            // ray collision pos
            const rayCollidePos = LLI(hit.l,ray.l)
            console.log(hit, ray.l, LLI(hit.l, ray.l))
            //console.log(rayCollidePos)
            if (!rayCollidePos) {
              throw new Error("This shouldnt be possible and is a bug")
            }
            // create new entry for such line
            entries.push(shrinkRay(constructRayEntry(i,nodes, rayCollidePos), 0.001))
            // create a node at the collision, with entries for the nodes it connects to
            // IDFK
            const newNodeIndex = nodes.push({ x: rayCollidePos.x, y: rayCollidePos.y, raycast: true, edges: [i, ray.ref, hit.ref] })
            nodes[i].edges.push(newNodeIndex - 1)
            nodes[ray.ref].edges.push(newNodeIndex - 1)
            nodes[hit.ref].edges.push(newNodeIndex - 1)
            */
          break;
      }
    })
  })
  return nodes;
}

import type { Node } from './astar';
import structuredClone from '@ungap/structured-clone';
import { Line, Entry, Point, RayE, NodeE, WallE, fastDist } from './col';
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

export function Raycast(
    nodes: Node[],
    walls: Line[],
    _hook?: (nodes: Node[], walls: Line[], data: HookData) => void
): Node[] {
    /* Setup */
    const margin = 2;
    const entries: Entry[] = [];
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);

    walls.forEach((w) => {
        xs.push(w.ex, w.sx);
        ys.push(w.ey, w.sy);
    });
    /*if (_hook)
        _hook([...nodes], [...walls], {
            type: HookDataType.Finished,
            info: 'finished',
            entries: [...entries],
        });*/

    const minX = Math.min.apply(null, xs);
    const maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);

    /* Construct entries */
    nodes.forEach((_node, i) => entries.push(constructNodeEntry(i, nodes)));
    walls.forEach((wall, _i) => entries.push(constructWallEntry(wall)));

    /* Raycast Time */
    nodes.forEach((node, i) => {
        if (node.raycast) return; // moves on to the next node if this one was created by the raycast

        // Edges of the map
        const edges: Point[] = [
            { x: node.x, y: minY },
            { x: node.x, y: maxY },
            { x: minX, y: node.y },
            { x: maxX, y: node.y },
        ];

        edges.forEach((n) => {
            const ray = constructRayEntry(i, nodes, n);

            if (ray.l.sx == ray.l.ex && ray.l.sy == ray.l.ey) return;

            if (_hook)
                _hook([...nodes], [...walls], {
                    type: HookDataType.RayConstructed,
                    ray: Object.assign({}, ray),
                    info: 'edges.forEach => ray constructed',
                });

            // begin absolute chonker of a line
            const hits = entries
                .filter((e) => {
                    return e.ref != i && collide(ray, e);
                })
                .sort((a, b) => distance(a, node) - distance(b, node));

            if (_hook)
                _hook([...nodes], [...walls], {
                    type: HookDataType.RayHits,
                    hits: Object.assign({}, hits),
                    ray: Object.assign({}, ray),
                    info: 'edges.forEach => hits calculated',
                });

            // end absolute chonker of a line
            if (hits.length == 0) {
                entries.push(ray); // we dont hit anything
                return;
            }

            /*
                TODO: Implement this so that newly created nodes on the same ray connect to the last created node
                Should also add to entries the ray between the last node and the new one
            */
            let lastNewNodeIndex = i;
            let hit: Entry | undefined;
            do {
                hit = hits.shift();
                if (hit == undefined) {
                    return;
                }

                // TODO: Implement some variation of this.
                // TODO: Also add detection if multiple rays over each other, remove all of them except the shortest one
                // const samePosHits = hits.filter((h) => h.ref == hit.ref);
                // if (samePosHits.length > 1) console.log(hit, samePosHits);

                // we HIT SOMETHING!!
                if (hit.t === 'node') {
                    // console.log(hit.ref === lastNewNodeIndex, hit.ref === i)
                    // idk you finish adding hooks
                    if (_hook)
                        _hook([...nodes], [...walls], {
                            type: HookDataType.HitNode,
                            node: { ...node },
                            edge: { ...n },
                            entries: structuredClone(entries),
                            hits: hits,
                            ray: ray,
                            hit: Object.assign({}, hit),
                            info: 'edges.forEach => we hit a node',
                        });

                    // we hit a node
                    const hid = hit.ref;
                    /* shant need this if we are using Sets
                    if (nodes[lastNewNodeIndex].edges.includes(hid)) {
                        return;
                    }
                    */
                    nodes[hid].edges.add(lastNewNodeIndex);
                    nodes[lastNewNodeIndex].edges.add(hid);
                    if (isNaN(hit.c.x)) console.log(hit.c);
                    entries.push(shrinkRay(constructRayEntry(i, nodes, hit.c), 0.001));
                    //console.log(hit.c, entries[h-1].l)
                    return;
                } else if (hit.t === 'wall') {
                    const hitpos = LLI(hit.ref, ray.l);
                    if (!hitpos) {
                        throw new Error('We both hit a wall and didnt hit one. wtf');
                    }
                    if (_hook)
                        _hook([...nodes], [...walls], {
                            type: HookDataType.HitWall,
                            node: { ...node },
                            edge: { ...n },
                            entries: structuredClone(entries),
                            hits: hits,
                            ray: ray,
                            hit: Object.assign({}, hit),
                            distance: distance(hit, node),
                            collisionPos: hitpos,
                            info: 'edges.forEach => we hit a wall',
                        });
                    if (!hitpos) {
                        throw new Error('This shouldnt be possible and is a bug');
                    }
                    if (isNaN(hitpos.x) || isNaN(hitpos.y)) console.log(hitpos);

                    entries.push(shrinkRay(constructRayEntry(i, nodes, hitpos), 0.001));

                    // we hit a wall
                    return;
                    // break;
                } else if (hit.t === 'ray') {
                    // we hit a ray
                    if (ray.ref == hit.ref) {
                        continue;
                    }
                    if (nodes[ray.ref].edges.has(hit.ref)) {
                        continue;
                    }
                    // ray collision pos
                    const rayCollidePos = LLI(hit.l, ray.l);

                    //console.log(hit, ray.l, LLI(hit.l, ray.l))
                    //console.log(rayCollidePos)
                    if (!rayCollidePos) {
                        throw new Error('This shouldnt be possible and is a bug');
                    }
                    // console.log(rayCollidePos)

                    if (_hook)
                        _hook([...nodes], [...walls], {
                            type: HookDataType.HitRay,
                            node: { ...node },
                            edge: { ...n },
                            entries: structuredClone(entries),
                            hits: hits,
                            ray: ray,
                            hit: Object.assign({}, hit),
                            distance: distance(hit, node),
                            collisionPos: rayCollidePos,
                            info: 'edges.forEach => we hit a ray',
                        });

                    // create new entry for such line

                    if (isNaN(rayCollidePos.x) || isNaN(rayCollidePos.y)) {
                        console.log(lastNewNodeIndex, hit, ray.l);
                    }

                    entries.push(shrinkRay(constructRayEntry(i, nodes, rayCollidePos), 0.001));

                    // create a node at the collision, with entries for the nodes it connects to
                    // IDFK

                    // check if the ray's endpoint hits a node
                    //const expanded = shrinkRay(hit, -0.001);
                    const hitp = { x: hit.l.ex, y: hit.l.ey };
                    const hitsP = entries.filter(
                        (e) =>
                            e.t == 'node' &&
                            within(hitp.x, e.c.x, 0.001) &&
                            within(hitp.y, e.c.y, 0.001)
                    );
                    let tedge: number[];
                    if (hitsP.length == 0) {
                        // the ray isnt nodetonode
                        //console.log('nope');
                        tedge = [lastNewNodeIndex, hit.ref];
                    } else {
                        //console.log('hit node!');
                        tedge = [lastNewNodeIndex, hit.ref, (hitsP[0] as NodeE).ref];
                        // oh god
                        const hitN = (hitsP[0] as NodeE).ref;
                        nodes[hitN].edges.delete(hit.ref);
                        nodes[hit.ref].edges.delete(hitN);
                    }
                    let newR1 = structuredClone(hit);
                    let newR2 = structuredClone(hit);
                    const splitted = split(hit.l, rayCollidePos);
                    newR1.l = splitted[0];
                    newR2.l = splitted[1];
                    newR2.ref =
                        nodes.push({
                            x: rayCollidePos.x,
                            y: rayCollidePos.y,
                            raycast: true,
                            edges: new Set<number>(tedge),
                        }) - 1;
                    lastNewNodeIndex = newR2.ref;
                    const rid = entries.indexOf(hit);
                    if (rid != -1) {
                        entries.splice(rid, 1);
                    } else {
                        throw new Error('unable to find ray...');
                    }
                    entries.push(constructNodeEntry(lastNewNodeIndex, nodes));
                    entries.push(shrinkRay(newR1, 0.001), shrinkRay(newR2, 0.001));
                    nodes[hit.ref].edges.add(lastNewNodeIndex);
                    if (hitsP.length > 0) {
                        const hitN = (hitsP[0] as NodeE).ref;
                        nodes[hitN].edges.add(lastNewNodeIndex);
                        //nodes[hit.ref].edges.add(lastNewNodeIndex);
                    }

                    //     let temp_lastNewNodeIndex = lastNewNodeIndex;
                    //     const existingNodes = nodes.filter(
                    //         (n) => n.x == rayCollidePos.x && n.y == rayCollidePos.y
                    //     );
                    //     if (existingNodes.length === 0) {
                    //         temp_lastNewNodeIndex =
                    //             nodes.push({
                    //                 x: rayCollidePos.x,
                    //                 y: rayCollidePos.y,
                    //                 raycast: true,
                    //                 // TODO: figure out which edges need to be added
                    //                 edges: new Set<number>([lastNewNodeIndex, ray.ref, hit.ref]),
                    //             }) - 1;

                    //         entries.push(constructNodeEntry(temp_lastNewNodeIndex, nodes));
                    //         // TODO: figure out which edges need to be added
                    //         nodes[ray.ref].edges.add(temp_lastNewNodeIndex);
                    //         nodes[hit.ref].edges.add(temp_lastNewNodeIndex);
                    //     }

                    //     if (_hook)
                    //         _hook([...nodes], [...walls], {
                    //             type: HookDataType.HitRayNewNode,
                    //             node: { ...node },
                    //             edge: { ...n },
                    //             entries: structuredClone(entries),
                    //             hits: hits,
                    //             newNode: nodes[temp_lastNewNodeIndex],
                    //             ray: ray,
                    //             info: 'edges.forEach => we hit a ray, new node created',
                    //             hit: Object.assign({}, hit),
                    //             distance: distance(hit, node),
                    //             collisionPos: rayCollidePos,
                    //         });

                    //     // TODO: figure out which edges need to be added
                    //     nodes[lastNewNodeIndex].edges.add(temp_lastNewNodeIndex);

                    //     lastNewNodeIndex = temp_lastNewNodeIndex;
                    //     continue;
                }
                // console.log('uh this shouldnt run');
            } while (hit?.t == 'ray');
        });
    });

    if (_hook)
        _hook([...nodes], [...walls], {
            type: HookDataType.Finished,
            info: 'finished',
            entries: structuredClone(entries),
        });

    return nodes;
}

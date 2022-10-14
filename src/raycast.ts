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

export function Raycast(
    nodes: Node[],
    walls: Line[],
    maxHits?: number,
    _hook?: (data: HookData, nodes?: Node[], walls?: Line[]) => void
): Node[] {
    let hook_calls = 0;
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

    const copiedNodes: Node[] = ([] as Node[]).concat(nodes);
    /* Raycast Time */
    for (const node of copiedNodes) {
        const i = nodes.indexOf(node);
        if (node.raycast) continue; // moves on to the next node if this one was created by the raycast

        // Edges of the map
        const edges: Point[] = [
            { x: node.x, y: minY },
            { x: node.x, y: maxY },
            { x: minX, y: node.y },
            { x: maxX, y: node.y },
        ];

        
        for (const n of edges) {
            const entriesForHook = ([] as Entry[]).concat(entries);
            const ray = constructRayEntry(i, nodes, n);

            if (ray.l.sx === ray.l.ex && ray.l.sy === ray.l.ey) continue;

            if (_hook) {
                hook_calls++;
                _hook({
                    type: HookDataType.RayConstructed,
                    entries: entriesForHook,
                    ray: Object.assign({}, ray),
                    info: 'edges.forEach => ray constructed',
                });
            }
            // begin absolute chonker of a line
            const hits = entries
                .filter((e) => {
                    return e.ref !== i && collide(ray, e);
                })
                .sort((a, b) => distance(a, node) - distance(b, node));

            if (_hook) {
                hook_calls++;
                _hook({
                    type: HookDataType.RayHits,
                    entries: entriesForHook,
                    hits: ([] as Entry[]).concat(hits),
                    ray: Object.assign({}, ray),
                    info: 'edges.forEach => hits calculated',
                });
            }
            // end absolute chonker of a line
            if (hits.length === 0) {
                entries.push(ray); // we dont hit anything
                continue;
            }

            /*
                TODO: Implement this so that newly created nodes on the same ray connect to the last created node
                Should also add to entries the ray between the last node and the new one
            */
            let lastNewNodeIndex = i;
            let hit: Entry | undefined;

            do {
                hit = hits.shift();
                if (hit === undefined) continue;

                // TODO: Implement some variation of this.
                // TODO: Also add detection if multiple rays over each other, remove all of them except the shortest one
                // const samePosHits = hits.filter((h) => h.ref == hit.ref);
                // if (samePosHits.length > 1) console.log(hit, samePosHits);

                // we HIT SOMETHING!!
                if (hit.t === 'node') {
                    if (_hook) {
                        hook_calls++;
                        _hook({
                            type: HookDataType.HitNode,
                            entries: entriesForHook,
                            ray: Object.assign({}, ray),
                            hit: Object.assign({}, hit),
                            info: 'edges.forEach => we hit a node',
                        });
                    }

                    const hid = hit.ref;
                    /* shant need this if we are using Sets
                    if (nodes[lastNewNodeIndex].edges.includes(hid)) {
                        return;
                    }
                    */
                    nodes[hid].edges.add(lastNewNodeIndex);
                    nodes[lastNewNodeIndex].edges.add(hid);
                    const rayEntryHitNode = constructRayEntry(i, nodes, hit.c);
                    if (!rayEntryHitNode.zeroLength) {
                        entries.push(rayEntryHitNode);
                    } else {
                        break;
                        // console.log(
                        //     'rayEntryHitNode is zero length\nNode',
                        //     nodes[i],
                        //     i,
                        //     '\nHit: ',
                        //     hit,
                        //     '\nRay: ',
                        //     ray
                        // );
                    }

                    break;
                } else if (hit.t === 'wall') {
                    const hitpos = LLI(hit.ref, ray.l);
                    if (!hitpos) {
                        throw new Error('We both hit a wall and didnt hit one. wtf');
                    };

                    if (_hook) {
                        hook_calls++;
                        _hook({
                            type: HookDataType.HitWall,
                            entries: entriesForHook,
                            ray: Object.assign({}, ray),
                            hit: Object.assign({}, hit),
                            distance: distance(hit, node),
                            collisionPos: Object.assign({}, hitpos),
                            info: 'edges.forEach => we hit a wall',
                        });
                    };

                    const rayEntryHitWall = constructRayEntry(i, nodes, hitpos);
                    if (rayEntryHitWall.zeroLength) {
                        /*console.log(
                            'rayEntryHitWall is zero length\nNode: ',
                            nodes[i],
                            i,
                            '\nHit: ',
                            hit,
                            '\nRay: ',
                            ray,
                            '\nHitpos: ',
                            hitpos
                        );*/
                        // we are likely on the wall
                        break;
                    } else {
                        entries.push(shrinkRay(rayEntryHitWall, 0.001));
                    };
                    // entries.push(shrinkRay(constructRayEntry(i, nodes, hitpos), 0.001));

                    // we hit a wall
                    break;
                } else if (hit.t === 'ray') {
                    // we hit a ray
                    if (ray.ref === hit.ref) {
                        continue;
                    };
                    if (nodes[ray.ref].edges.has(hit.ref)) {
                        continue;
                    };

                    // ray collision pos
                    const rayCollidePos = LLI(hit.l, ray.l);
                    if (!rayCollidePos) {
                        throw new Error('This shouldnt be possible and is a bug');
                    };

                    // create new entry for such line

                    /*
                    if (isNaN(rayCollidePos.x) || isNaN(rayCollidePos.y)) {
                        console.log(lastNewNodeIndex, hit, ray);
                    }
                    */

                    const rayEntryHitRay = constructRayEntry(i, nodes, rayCollidePos);
                    if (!rayEntryHitRay.zeroLength) {
                        entries.push(rayEntryHitRay);
                    } else {
                        continue;
                        /*console.log(
                            'rayEntryHitRay is zero length\nNode',
                            nodes[i],
                            i,
                            '\nHit: ',
                            hit,
                            '\nRay: ',
                            ray,
                            '\nRayCollidePos: ',
                            rayCollidePos
                        );*/
                    }

                    if (_hook) {
                        hook_calls++;
                        _hook({
                            type: HookDataType.HitRay,
                            entries: ([] as Entry[]).concat(entries),
                            ray: Object.assign({}, ray),
                            hit: Object.assign({}, hit),
                            distance: distance(hit, node),
                            collisionPos: Object.assign({}, rayCollidePos),
                            info: 'edges.forEach => we hit a ray',
                        });
                    }
                    // entries.push(shrinkRay(constructRayEntry(i, nodes, rayCollidePos), 0.001));

                    // create a node at the collision, with entries for the nodes it connects to
                    // IDFK

                    // check if the ray's endpoint hits a node
                    //const expanded = shrinkRay(hit, -0.001);
                    const hitp = { x: hit.l.ex, y: hit.l.ey };
                    const hitsP = entries.filter(
                        (e) =>
                            e.t === 'node' &&
                            within(hitp.x, e.c.x, 0.001) &&
                            within(hitp.y, e.c.y, 0.001)
                    );
                    let tedge: number[] = [];
                    if (hitsP.length === 0) {
                        // the ray isnt nodetonode
                        //console.log('nope');
                        tedge.push(lastNewNodeIndex, hit.ref);
                    } else {
                        //console.log('hit node!');
                        tedge.push(lastNewNodeIndex, hit.ref, (hitsP[0] as NodeE).ref);
                        // oh god
                        const hitN = (hitsP[0] as NodeE).ref;
                        nodes[hitN].edges.delete(hit.ref);
                        nodes[hit.ref].edges.delete(hitN);
                    }

                    const newNode = {
                        x: rayCollidePos.x,
                        y: rayCollidePos.y,
                        raycast: true,
                        edges: new Set<number>(tedge),
                    }

                    let existingNodes = nodes.filter(n => n.x === newNode.x && n.y === newNode.y)
                    if (existingNodes.length > 0) {
                        for (const en of existingNodes) {
                            for (const nn of newNode.edges) {
                                en.edges.add(nn);
                            }
                        }
                    }

                    let newR1 = Object.assign({}, hit);
                    let newR2 = Object.assign({}, hit);
                    const splitted = split(hit.l, rayCollidePos);
                    newR1.l = splitted[0];
                    newR2.l = splitted[1];

                    if (existingNodes.length === 0) {
                        newR2.ref = nodes.push(newNode) - 1
                        lastNewNodeIndex = newR2.ref;
                    }
                    const rid = entries.indexOf(hit);
                    if (rid != -1) {
                        entries.splice(rid, 1);
                    } else {
                        throw new Error('unable to find ray...');
                    }

                    // TODO Add zero length check to new node creation
                    if (existingNodes.length > 0) continue;
                    entries.push(constructNodeEntry(lastNewNodeIndex, nodes));
                    
                    if (_hook) {
                        hook_calls++;
                        _hook({
                            type: HookDataType.HitRayNewNode,
                            entries: entriesForHook,
                            newNode: Object.assign({}, newNode),
                            ray: Object.assign({}, ray),
                            info: 'edges.forEach => we hit a ray, new node created',
                            hit: Object.assign({}, hit),
                            distance: distance(hit, node),
                            collisionPos: Object.assign({}, rayCollidePos),
                        });
                    }
                    // TODO Check this for zero length
                    entries.push(newR1, newR2);
                    nodes[hit.ref].edges.add(lastNewNodeIndex);
                    if (hitsP.length > 0) {
                        const hitN = (hitsP[0] as NodeE).ref;
                        nodes[hitN].edges.add(lastNewNodeIndex);
                        //nodes[hit.ref].edges.add(lastNewNodeIndex);
                    }
                    continue;

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
            } while (hit?.t === 'ray');
        };
    };

    if (_hook) {
        hook_calls++;
        _hook({
            type: HookDataType.Finished,
            info: 'finished',
            entries: structuredClone(entries),
        });
    }
    return nodes;
}

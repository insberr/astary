import Heap from "heap-js";
//import { makeNodes, makeUint8ClampedArray } from "./makeNodes";
import { generateNodes, svgToPaths } from "./generateNodesFromPathImage";

export type Node = {
    x: number;
    y: number;
    // o[x|y] is the original x or y value
    ox: number;
    oy: number
    addlWeight?: number;
    edges: number[];
};

/* from wikipedia
// https://en.wikipedia.org/wiki/A*_search_algorithm
function reconstruct_path(cameFrom, current)
    total_path := {current}
    while current in cameFrom.Keys:
        current := cameFrom[current]
        total_path.prepend(current)
    return total_path

// A* finds a path from start to goal.
// h is the heuristic function. h(n) estimates the cost to reach goal from node n.
function A_Star(start, goal, h)
    // The set of discovered nodes that may need to be (re-)expanded.
    // Initially, only the start node is known.
    // This is usually implemented as a min-heap or priority queue rather than a hash-set.
    openSet := {start}

    // For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from start
    // to n currently known.
    cameFrom := an empty map

    // For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
    gScore := map with default value of Infinity
    gScore[start] := 0

    // For node n, fScore[n] := gScore[n] + h(n). fScore[n] represents our current best guess as to
    // how cheap a path could be from start to finish if it goes through n.
    fScore := map with default value of Infinity
    fScore[start] := h(start)

    while openSet is not empty
        // This operation can occur in O(Log(N)) time if openSet is a min-heap or a priority queue
        current := the node in openSet having the lowest fScore[] value
        if current = goal
            return reconstruct_path(cameFrom, current)

        openSet.Remove(current)
        for each neighbor of current
            // d(current,neighbor) is the weight of the edge from current to neighbor
            // tentative_gScore is the distance from start to the neighbor through current
            tentative_gScore := gScore[current] + d(current, neighbor)
            if tentative_gScore < gScore[neighbor]
                // This path to neighbor is better than any previous one. Record it!
                cameFrom[neighbor] := current
                gScore[neighbor] := tentative_gScore
                fScore[neighbor] := tentative_gScore + h(neighbor)
                if neighbor not in openSet
                    openSet.add(neighbor)

    // Open set is empty but goal was never reached
    return failure
*/

// https://en.wikipedia.org/wiki/A*_search_algorithm
function reconstruct_path(cameFrom: Map<number, number>, current: number): number[] {
    var total_path = [current];
    //console.log("reconstruct path")
    //console.log(cameFrom)
    while (cameFrom.has(current)) { 
        //console.log("current", current)
        current = cameFrom.get(current) as number;
        //console.log("to", current) 
        total_path.unshift(current);
    }
    return total_path;
}

function edgeW(current: number, nei: number, nodes: Node[]): number {
    const w = (nodes[current].addlWeight || 0) + (nodes[nei].addlWeight || 0);
    return w + Math.sqrt(Math.pow(nodes[current].x - nodes[nei].x, 2) + Math.pow(nodes[current].y - nodes[nei].y, 2));

}
function gInfinite(m: Map<number, number>, n: number): number {
    if (m.has(n)) {
        let out = m.get(n) ;
        //@ts-ignore should never has() but not able to get()
        return out;
    }
    return Infinity;
}

function AStar(start: number, goal: number, nodes: Node[]): number[] {
    function h(n: number): number {
        const node = nodes[n];
        const goalNode = nodes[goal];
        return Math.sqrt(Math.pow(node.x - goalNode.x, 2) + Math.pow(node.y - goalNode.y, 2));
    }
    var openSet = new Heap<number>(Heap.minComparator);
    openSet.push(start);
    var cameFrom = new Map<number, number>();

    var gScore = new Map<number, number>();
    gScore.set(start, 0)
    var fScore = new Map<number, number>();
    fScore.set(start,h(start));

    while (openSet.length > 0) {
        var current = openSet.toArray().reduce((a, b) => gInfinite(fScore,a) < gInfinite(fScore,b) ? a : b);
        if (current == goal) {
            return reconstruct_path(cameFrom, current);
        }
        //console.log("visited", current)
        openSet.remove(current);
        for (const neighbor of nodes[current].edges) {
            const tentative_gScore = gInfinite(gScore,current) + edgeW(current, neighbor, nodes);
            //console.log(gScore)
            //console.log("tentative_gScore", tentative_gScore, "gScore", gInfinite(gScore,neighbor))
            if (tentative_gScore < gInfinite(gScore,neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentative_gScore);
                fScore.set(neighbor, tentative_gScore + h(neighbor));
                if (!openSet.contains(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }

        
    }
    
    throw new Error("No path found");
}

//_astar(0, 1, (n) => 0);
export * from "./random";
export * from "./raycast"
export { AStar, generateNodes, svgToPaths };

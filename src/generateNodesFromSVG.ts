import { Node } from "./astar";
import { ElementNode, parse, RootNode } from "svg-parser";
import { Node as SVGNode } from "svg-parser";
import {
    parseSVG,
    makeAbsolute,
    VerticalLineToCommandMadeAbsolute,
    HorizontalLineToCommandMadeAbsolute,
} from "svg-path-parser";
import type { Line } from "./col";

export { parseSVG, makeAbsolute };

export type CirclePath = {
    x: number;
    y: number;
    fill: string | number;
    d?: any[];
};
export type LinePath = {
    sx: number;
    sy: number;
    ex: number;
    ey: number;
    fill: string | number;
    d?: any[];
};
export type Paths = { circles: CirclePath[]; lines: LinePath[] };
export type Colors = {
    walls: string[];
    walkable: string[];
    otherColorsToIgnore?: string[];
};

export function defaultFilterFunction(svgElement: SVGNode): Paths {
    const svgGElements = (svgElement as ElementNode).children
        .filter((c) => {
            return (c as ElementNode).tagName === "g";
        })
        .filter((c) => {
            return ((c as ElementNode)?.properties?.id || "") === "pathfinding";
        })[0];

    // Circles: Nodes
    if (typeof svgGElements === "string" || svgGElements == undefined)
        console.log(svgElement, svgGElements);
    const svgGID_Nodes = (svgGElements as ElementNode).children.filter((c) => {
        return (
            (c as ElementNode).tagName === "g" &&
            (c as ElementNode)?.properties?.id === "pathfindingNodes"
        );
    })[0];

    // Lines: Walls
    const svgGID_Walls = (svgGElements as ElementNode).children.filter((c) => {
        return (
            (c as ElementNode).tagName === "g" &&
            (c as ElementNode)?.properties?.id === "pathfindingWalls"
        );
    })[0];

    const elementCircles = (svgGID_Nodes as ElementNode).children.filter(
        (c) => {
            if ((c as ElementNode).tagName !== "circle") {
                return false;
            }
            return true;
        }
    );

    const elementLines = (svgGID_Walls as ElementNode).children.filter((c) => {
        if ((c as ElementNode).tagName !== "path") {
            return false;
        }
        return true;
    });

    const svgCirclesToPaths = elementCircles.map((c) => {
        const cx = parseFloat(
            (c as ElementNode)?.properties?.cx.toString() || "0"
        );
        const cy = parseFloat(
            (c as ElementNode)?.properties?.cy.toString() || "0"
        );
        const fill =
            (c as ElementNode)?.properties?.style
                .toString()
                .split(";")
                .filter((s) => s.includes("fill:"))[0]
                .split(":")[0] || "why is this undefined";
        return { x: cx, y: cy, fill: fill };
    });

    const svgLinesToPaths = elementLines.map((c) => {
        const d = parseSVG((c as ElementNode)?.properties?.d.toString() || "");
        makeAbsolute(d);

        const vertical = d.filter(
            (v) => v.code === "V"
        ) as VerticalLineToCommandMadeAbsolute[];
        const horizontal = d.filter(
            (v) => v.code === "H"
        ) as HorizontalLineToCommandMadeAbsolute[];

        const sx = horizontal[0]?.x0 || vertical[0]?.x0 || 0;
        const sy = horizontal[0]?.y0 || vertical[0]?.y0 || 0;
        const ex = horizontal[0]?.x || vertical[0]?.x || 0;
        const ey = horizontal[0]?.y || vertical[0]?.y || 0;

        const stroke =
            (c as ElementNode)?.properties?.style
                .toString()
                .split(";")
                .filter((s) => s.includes("stroke:"))[0]
                .split(":")[0] || "why is this undefined";

        return { sx: sx, sy: sy, ex: ex, ey: ey, fill: stroke, d: d };
    });

    return { circles: svgCirclesToPaths, lines: svgLinesToPaths };
}

// Remember transparent areas are also considered walkable
export function svgToPaths(
    svgAsString: string,
    filterFn: (svgElement: SVGNode) => Paths
): Paths {
    const parsed = parse(svgAsString);
    console.log(svgAsString, parsed);
    const svgElement = parsed.children.filter((c) => {
        if ((c as ElementNode).tagName !== "svg") {
            return false;
        }
        return true;
    })[0];

    return filterFn(svgElement);
}

export function generateNodes(
    paths: Paths,
    nodeColorWeights?: [string, number][]
): Node[] {
    const nodes: Node[] = [];
    for (const path of paths.circles) {
        const node = {
            x: path.x,
            y: path.y,
            addlWeight:
                nodeColorWeights?.find((cw) => cw[0] === path.fill)?.[1] || 0,
            edges: new Set<number>(),
        };
        nodes.push(node);
    }

    return nodes;
}

export function generateWalls(paths: Paths): Line[] {
    const lines: Line[] = [];
    for (const path of paths.lines) {
        const line = {
            sx: path.sx,
            sy: path.sy,
            ex: path.ex,
            ey: path.ey,
        };

        lines.push(line);
    }

    return lines;
}

import { Node } from './astar';
import { parse } from 'svg-parser';
import { parseSVG, makeAbsolute } from 'svg-path-parser';
import * as fs from 'fs';

export type Path = { x: number, y: number, fill: string, d: any[] };
export type Paths = Path[];
export type Colors = {
    walls: string[],
    walkable: string[],
    otherColorsToIgnore?: string[],
}

// Remember transparent areas are also considered walkable
export function svgToPaths(svgAsString: string, colors: Colors, readFile?: string): Paths {
    if (readFile) svgAsString = fs.readFileSync(readFile, 'utf8');

    const filterColors = [...colors.walls, ...colors.walkable, ...(colors?.otherColorsToIgnore || [])]
    console.log(filterColors)
    // TODO: find the element fith all the fills and strokes and whatever
    const parsed = parse(svgAsString).children.filter(c => {
        if (c.tagName !== 'svg') {
            return false;
        }
        return true;
    })[0].children.filter(c => c.tagName === 'g')[0].children.filter(c => {
        if (c.tagName !== 'path') {
            return false;
        }
        if (c.properties?.fill) {
            return true;
        }
    }).filter(c => !filterColors.includes(c.properties.fill)).map(c => {
        const d = parseSVG(c.properties.d);
        // TODO parse d for coords
        makeAbsolute(d);
        // console.log(d.filter(v => v.code === 'M' ));
        const moveTo = d.filter(v => v.code === 'M' )[0];
        // console.log(moveTo);

        return { x: moveTo.x, y: moveTo.y, fill: c.properties.fill, d: d };
    });

    return parsed;
}

export function generateNodes(paths: Paths, nodeColorWeights?: [string, number][]): Node[] {
    const nodes: Node[] = [];
    for (const path of paths) {
        const node = {
            x: path.x,
            y: path.y,
            addlWeight: nodeColorWeights?.find(cw => cw[0] === path.fill)?.[1] || 0,
            edges: [],
        }
        nodes.push(node)
    }

    // Temporary
    return nodes;
}

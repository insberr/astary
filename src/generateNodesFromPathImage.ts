import { Node } from './astar';
import { ElementNode, parse } from 'svg-parser';
import { Node as SVGNode } from 'svg-parser';
import { parseSVG, makeAbsolute, MoveToCommand } from 'svg-path-parser';
import { Raycast } from './raycast';

export type Path = { x: number, y: number, fill: string | number, d?: any[] };
export type Paths = Path[];
export type Colors = {
    walls: string[],
    walkable: string[],
    otherColorsToIgnore?: string[],
}

// Remember transparent areas are also considered walkable
export function svgToPaths(svgAsString: string, colors: Colors, filterFn?: (svgData: SVGNode) => Paths): Paths {
    // const filterColors = [...colors.walls, ...colors.walkable, ...(colors?.otherColorsToIgnore || [])]
    //console.log(filterColors)
    // TODO: find the element fith all the fills and strokes and whatever
    const parsed = parse(svgAsString)
    const svgElement = parsed.children.filter(c => {
        if ((c as ElementNode).tagName !== 'svg') {
            return false;
        }
        return true;
    })[0]
    
    const svgGElements = (svgElement as ElementNode).children.filter(c => {
        return (c as ElementNode).tagName === 'g'
    }).filter(c => {
        return ((c as ElementNode)?.properties?.id || "") === 'pathfinding'
    })[0]
    
    const svgGID_Nodes = (svgGElements as ElementNode).children.filter(c => {
        return (c as ElementNode).tagName === 'g' && (c as ElementNode)?.properties?.id === 'pathfindingNodes'
    })[0]
    
    const elementCircles = (svgGID_Nodes as ElementNode).children.filter(c => {
        if ((c as ElementNode).tagName !== 'circle') {
            return false;
        }
        return true;
    })

    // console.log(elementCircles)

    /*const pathFills = elementCircles.filter(c => !filterColors.includes(((c as SVGNode) as ElementNode)?.properties?.fill.toString() || ''))
    const fillsToNodes = pathFills.map(c => {
        const d = parseSVG((c as ElementNode)?.properties?.d.toString() || '');
        // TODO parse d for coords
        makeAbsolute(d);
        // console.log(d.filter(v => v.code === 'M' ));
        const moveTo = d.filter(v => v.code === 'M' )[0] as MoveToCommand;
        // console.log(moveTo);

        return { x: moveTo.x, y: moveTo.y, fill: (c as ElementNode)?.properties?.fill || 'why is this undefined', d: d };
    });
    */

    const svgCirclesToPaths = elementCircles.map(c => {
        const cx = parseFloat((c as ElementNode)?.properties?.cx.toString() || '0');
        const cy = parseFloat((c as ElementNode)?.properties?.cy.toString() || '0');
        const fill = (c as ElementNode)?.properties?.style.toString().split(';').filter(s => s.includes('fill:'))[0].split(':')[0] || 'why is this undefined';
        return { x: cx, y: cy, fill: fill };
    })

    return svgCirclesToPaths;
}

export function generateNodes(paths: Paths, nodeColorWeights?: [string, number][]): Node[] {
    const nodes: Node[] = [];
    for (const path of paths) {
        const node = {
            x: path.x, //+path.x.toFixed(),
            y: path.y, //+path.y.toFixed(),
            dx: path.x - Math.floor(path.x),
            dy: path.y - Math.floor(path.y),
            ox: path.x,
            oy: path.y,
            addlWeight: nodeColorWeights?.find(cw => cw[0] === path.fill)?.[1] || 0,
            edges: [],
        }
        nodes.push(node)
    }

    // Temporary
    return nodes;
}

export function svgNodesRaycast(nodes: Node[]): Node[] {
    return Raycast(nodes)
}

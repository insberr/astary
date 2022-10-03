import { HookBase, HookData, HookDataType, randomNodes, randomWalls, Raycast } from "../../src/astar";
const nodes = randomNodes(64,1).map((e) => {return {...e, edges:[]}})
const walls = randomWalls(5,20,4)
const steps: HookData[] = []
let currentStep = 0
let doDrawPrev = false;


(document.getElementById("displ") as HTMLInputElement).addEventListener("change", () => {
    doDrawPrev = (document.getElementById("displ") as HTMLInputElement).checked;
    upd()
})

function clamp() {
    currentStep = Math.max(Math.min(currentStep, steps.length-1),0)
    upd()
}
function upd() {
    const f = document.getElementById("num") as HTMLInputElement
    f.value = currentStep.toString().padStart((steps.length-1).toString().length, "0")
    draw()

}
document.getElementById("next")?.addEventListener("click", () => {
    currentStep+=1
    clamp()
})
document.getElementById("prev")?.addEventListener("click", () => {
    currentStep -= 1;
    clamp()
})
document.getElementById("num")?.addEventListener("blur", () => {
    const e = document.getElementById("num") as HTMLInputElement
    currentStep = parseInt(e.value)
    if (isNaN(currentStep)) {
        currentStep = 0
    }
    clamp()
})
document.getElementById("first")?.addEventListener("click", () => {
    currentStep = 0;
    clamp()
})
document.getElementById("last")?.addEventListener("click", () => {
    currentStep = steps.length-1
    clamp()
})

const casted = Raycast(nodes,walls,(n,w,d) => {
    steps.push(d)
})

const dt = document.getElementById("info")
if (dt) { 
    dt.innerText="64 nodes; "+ casted.length + " after cast; "+steps.length+" steps (0-"+(steps.length-1)+");"
}


function draw() {
    const cstep = steps[currentStep];
    (document.getElementById("cstep") as HTMLPreElement).innerText = JSON.stringify(cstep,null, 2);
    (document.getElementById("cstepInfo") as HTMLDivElement).innerText = cstep.info + " (" + HookDataType[cstep.type] + ")"
}

clamp()
/*const ele = document.createElement("pre")
ele.innerText = JSON.stringify(steps, null, 2)
document.body.appendChild(ele)*/
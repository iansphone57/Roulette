console.log("SCRIPT LOADED");

let spins = [];
let useExactSolver = false; // toggle mode

// ---------------- SECTORS ----------------
const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
const tiers   = [27,13,36,11,30,8,23,10,5,24,16,33];
const orphelins = [1,20,14,31,9,17,34,6];

// ---------------- GRID ----------------
const boardRows = [
    [0,1,4,7,10,13,16,19,22,25,28,31,34],
    [0,2,5,8,11,14,17,20,23,26,29,32,35],
    [0,3,6,9,12,15,18,21,24,27,30,33,36]
];

// ---------------- FAST SOLVER (GREEDY) ----------------
function solveMinPucksFast(rows, targetList){

    const targets = [...new Set(targetList)];
    let uncovered = new Set(targets);

    let placements = [];

    function add(nums, type, pos){
        placements.push({nums, type, pos});
    }

    // Generate placements
    for(let r=0;r<3;r++){
        for(let c=0;c<rows[r].length-1;c++){
            add([rows[r][c],rows[r][c+1]], "H", [r,c]);
        }
    }

    for(let c=0;c<rows[0].length;c++){
        add([rows[0][c],rows[1][c]], "V", [0,c]);
        add([rows[1][c],rows[2][c]], "V", [1,c]);
    }

    let solution = [];

    while(uncovered.size > 0){

        let best = null;
        let bestHits = [];

        for(let p of placements){
            const hits = p.nums.filter(n => uncovered.has(n));
            if(hits.length > bestHits.length){
                best = p;
                bestHits = hits;
            }
        }

        if(!best) break;

        solution.push({
            ...best,
            hits: bestHits
        });

        bestHits.forEach(n => uncovered.delete(n));
    }

    return {
        minPucks: solution.length,
        placements: solution
    };
}

// ---------------- EXACT SOLVER (LIMITED) ----------------
function solveMinPucksExactLimited(rows, targetList){

    const MAX = 12;
    const limited = targetList.slice(-MAX);

    return solveMinPucks(rows, limited);
}

// ---------------- ORIGINAL EXACT SOLVER ----------------
function solveMinPucks(rows, targetList) {

    const uniqueTargets = [...new Set(targetList)];
    const map = new Map();
    uniqueTargets.forEach((n,i)=>map.set(n,i));

    const FULL = (1 << uniqueTargets.length) - 1;

    let placements = [];

    function add(nums,type,pos){
        let mask=0, hits=[];
        for(let n of nums){
            if(map.has(n)){
                mask |= (1<<map.get(n));
                hits.push(n);
            }
        }
        if(mask) placements.push({mask,hits,type,pos});
    }

    for(let r=0;r<3;r++){
        for(let c=0;c<rows[r].length-1;c++){
            add([rows[r][c],rows[r][c+1]],"H",[r,c]);
        }
    }

    for(let c=0;c<rows[0].length;c++){
        add([rows[0][c],rows[1][c]],"V",[0,c]);
        add([rows[1][c],rows[2][c]],"V",[1,c]);
    }

    function bits(x){let c=0;while(x){x&=x-1;c++;}return c;}

    placements.sort((a,b)=>bits(b.mask)-bits(a.mask));

    let best=Infinity;
    let bestSol=[];

    function dfs(mask,i,used,path){
        if(used>=best) return;

        if(mask===FULL){
            best=used;
            bestSol=[...path];
            return;
        }

        if(i>=placements.length) return;

        path.push(placements[i]);
        dfs(mask|placements[i].mask,i+1,used+1,path);
        path.pop();

        dfs(mask,i+1,used,path);
    }

    dfs(0,0,0,[]);

    return {minPucks: best===Infinity?"N/A":best, placements: bestSol};
}

// ---------------- CORE ----------------

function addSpin(){
    const input=document.getElementById("spinInput");
    const n=parseInt(input.value);

    if(isNaN(n)||n<0||n>36){
        input.value="";
        return;
    }

    spins.push(n);
    input.value="";
    setTimeout(()=>input.focus(),0);

    updateAll();
}

function generateSpins(){
    spins.length=0;
    for(let i=0;i<1000;i++){
        spins.push(Math.floor(Math.random()*37));
    }
    updateAll();
}

function clearAll(){
    spins.length=0;
    updateAll();
}

function undoSpin(){
    spins.pop();
    updateAll();
}

// ---------------- UPDATE ----------------

let coverageTimeout;

function updateAll(){
    updateHistory();
    updateSpinCount();
    updateHeatmap();
    updatePredictions();

    clearTimeout(coverageTimeout);
    coverageTimeout = setTimeout(updateCoverage, 100);
}

// ---------------- UI ----------------

function updateSpinCount(){
    document.getElementById("spinCount").textContent =
        `(${spins.length} spins)`;
}

function updateHistory(){
    document.getElementById("historyList").innerHTML =
        spins.slice(-15).join(", ");
}

function updateHeatmap(){
    let v=0,t=0,o=0;

    spins.forEach(n=>{
        if(voisins.includes(n))v++;
        else if(tiers.includes(n))t++;
        else o++;
    });

    document.getElementById("heatmapOutput").innerHTML =
        `Voisins: ${v}<br>Tiers: ${t}<br>Orphelins: ${o}`;
}

function updatePredictions(){
    let counts=Array(37).fill(0);

    spins.forEach(n=>counts[n]++);

    let top = counts
        .map((v,i)=>({i,v}))
        .sort((a,b)=>b.v-a.v)
        .slice(0,3)
        .map(x=>x.i);

    document.getElementById("predictionOutput").innerHTML =
        `Top: ${top.join(", ")}`;
}

// ---------------- COVERAGE ----------------

function updateCoverage(){

    const out=document.getElementById("coverageOutput");

    if(spins.length===0){
        out.innerHTML="Enter spins";
        return;
    }

    let result;

    if(useExactSolver){
        result = solveMinPucksExactLimited(boardRows, spins);
        out.innerHTML = `<b>Exact Mode (last 12 spins)</b><br>`;
    } else {
        result = solveMinPucksFast(boardRows, spins);
        out.innerHTML = `<b>Fast Mode (all spins)</b><br>`;
    }

    out.innerHTML +=
        `Min Pucks: ${result.minPucks}<br><br>` +
        result.placements.map((p,i)=>
            `${i+1}) ${p.type} [${p.pos}] → ${p.hits.join(", ")}`
        ).join("<br>");
}

// ---------------- TOGGLE ----------------

function toggleSolver(){
    useExactSolver = !useExactSolver;
    updateAll();
}

// ---------------- BUTTON FIX ----------------

window.generateSpins = generateSpins;
window.clearAll = clearAll;
window.addSpin = addSpin;
window.undoSpin = undoSpin;
window.toggleSolver = toggleSolver;

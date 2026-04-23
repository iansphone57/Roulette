let spins = [];

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

// ---------------- PUCK SOLVER ----------------
function solveMinPucks(rows, targetList) {
    if (!targetList || targetList.length === 0) {
        return { minPucks: 0, placements: [] };
    }

    const uniqueTargets = [...new Set(targetList)];
    const targetIndex = new Map();
    uniqueTargets.forEach((n, i) => targetIndex.set(n, i));

    const FULL_MASK = (1 << uniqueTargets.length) - 1;

    let placements = [];

    function makePlacement(nums, type, pos) {
        let mask = 0;
        let hits = [];

        for (let n of nums) {
            if (targetIndex.has(n)) {
                mask |= (1 << targetIndex.get(n));
                hits.push(n);
            }
        }

        if (mask !== 0) {
            placements.push({ mask, hits, type, pos });
        }
    }

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < rows[r].length - 1; c++) {
            makePlacement([rows[r][c], rows[r][c+1]], "H", [r,c]);
        }
    }

    for (let c = 0; c < rows[0].length; c++) {
        makePlacement([rows[0][c], rows[1][c]], "V", [0,c]);
        makePlacement([rows[1][c], rows[2][c]], "V", [1,c]);
    }

    for (let c = 0; c < rows[0].length - 1; c++) {
        makePlacement([
            rows[0][c], rows[0][c+1],
            rows[1][c], rows[1][c+1]
        ], "S", [0,c]);

        makePlacement([
            rows[1][c], rows[1][c+1],
            rows[2][c], rows[2][c+1]
        ], "S", [1,c]);
    }

    function countBits(x) {
        let c = 0;
        while (x) { x &= x - 1; c++; }
        return c;
    }

    placements.sort((a, b) => countBits(b.mask) - countBits(a.mask));

    let bestCount = Infinity;
    let bestSolution = [];

    function dfs(mask, index, used, path) {
        if (used >= bestCount) return;

        if (mask === FULL_MASK) {
            bestCount = used;
            bestSolution = [...path];
            return;
        }

        if (index >= placements.length) return;

        let remaining = FULL_MASK & ~mask;
        let maxCover = countBits(placements[index].mask);
        let minNeeded = Math.ceil(countBits(remaining) / Math.max(1, maxCover));

        if (used + minNeeded >= bestCount) return;

        path.push(placements[index]);
        dfs(mask | placements[index].mask, index + 1, used + 1, path);
        path.pop();

        dfs(mask, index + 1, used, path);
    }

    dfs(0, 0, 0, []);

    return {
        minPucks: bestCount === Infinity ? "N/A" : bestCount,
        placements: bestSolution
    };
}

// ---------------- CORE FUNCTIONS ----------------

// Add spin
function addSpin() {
    const input = document.getElementById("spinInput");
    const num = parseInt(input.value);

    if (isNaN(num) || num < 0 || num > 36) {
        input.value = "";
        return;
    }

    spins.push(num);
    input.value = "";

    setTimeout(() => input.focus(), 0);

    updateAll();
}

// Generate spins (FIXED)
function generateSpins() {
    spins.length = 0; // FIX: proper reset

    for (let i = 0; i < 1000; i++) {
        spins.push(Math.floor(Math.random() * 37));
    }

    updateAll();
}

// Clear
function clearAll() {
    spins.length = 0;
    updateAll();
}

// Undo
function undoSpin() {
    if (spins.length === 0) return;
    spins.pop();
    updateAll();
}

// Update loop
function updateAll() {
    updateHistory();
    updateSpinCount();
    updateSampleStrength();
    updateHeatmap();
    updateBiasStats();
    updatePredictions();
    updateTrendsAndCoverage();
}

// ---------------- UI ----------------

function updateSpinCount() {
    document.getElementById("spinCount").textContent =
        `(${spins.length} spins)`;
}

function updateHistory() {
    document.getElementById("historyList").innerHTML =
        spins.slice(-15).join(", ");
}

function updateSampleStrength() {
    const n = spins.length;
    let msg = `Spins: ${n} — `;

    if (n < 30) msg += "Very early";
    else if (n < 100) msg += "Unstable";
    else msg += "Usable";

    document.getElementById("sampleStrength").textContent = msg;
}

function updateHeatmap() {
    let v=0,t=0,o=0;

    for (let n of spins) {
        if (voisins.includes(n)) v++;
        else if (tiers.includes(n)) t++;
        else if (orphelins.includes(n)) o++;
    }

    document.getElementById("heatmapOutput").innerHTML =
        `Voisins: ${v}<br>Tiers: ${t}<br>Orphelins: ${o}`;
}

function updateBiasStats() {
    const out = document.getElementById("biasOutput");

    if (spins.length < 20) {
        out.innerHTML = "Need 20+ spins";
        return;
    }

    let counts = Array(37).fill(0);
    spins.forEach(n => counts[n]++);

    const expected = spins.length / 37;

    let hot=[], cold=[];

    for (let i=0;i<37;i++){
        if (counts[i] > expected*1.8) hot.push(i);
        if (counts[i] < expected*0.4) cold.push(i);
    }

    out.innerHTML =
        `Hot: ${hot.join(", ") || "None"}<br>
         Cold: ${cold.join(", ") || "None"}`;
}

function updatePredictions() {
    const out = document.getElementById("predictionOutput");

    if (spins.length < 10) {
        out.innerHTML = "Need 10+ spins";
        return;
    }

    let counts = Array(37).fill(0);
    spins.forEach(n => counts[n]++);

    let ranked = counts
        .map((v,i)=>({num:i,score:v}))
        .sort((a,b)=>b.score-a.score)
        .slice(0,3);

    out.innerHTML =
        `Top: ${ranked.map(r=>r.num).join(", ")}`;
}

// ---------------- COVERAGE ----------------

function updateTrendsAndCoverage() {
    const trendOut = document.getElementById("trendOutput");
    const covOut = document.getElementById("coverageOutput");

    trendOut.innerHTML =
        spins.length < 50 ? "No stable trend yet" : "Tracking trends...";

    const targets = spins.slice(-17);

    if (targets.length === 0) {
        covOut.innerHTML = "Enter spins to see coverage";
        return;
    }

    const result = solveMinPucks(boardRows, targets);

    if (!result.placements || result.placements.length === 0) {
        covOut.innerHTML = "No valid coverage found";
        return;
    }

    covOut.innerHTML =
        `<b>Optimal Coverage (last ${targets.length})</b><br>
         Minimum Pucks: ${result.minPucks}<br><br>` +
        result.placements.map((p,i)=>
            `${i+1}) ${p.type} @ [${p.pos}] → ${p.hits.join(", ")}`
        ).join("<br>");
}

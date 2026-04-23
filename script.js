let spins = [];

// Wheel sectors (European)
const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
const tiers   = [27,13,36,11,30,8,23,10,5,24,16,33];
const orphelins = [1,20,14,31,9,17,34,6];

// --- ROULETTE GRID ---
const boardRows = [
    [0,1,4,7,10,13,16,19,22,25,28,31,34],
    [0,2,5,8,11,14,17,20,23,26,29,32,35],
    [0,3,6,9,12,15,18,21,24,27,30,33,36]
];

// --- PUCK SOLVER ---
function solveMinPucks(rows, targetList) {
    const targetIndex = new Map();
    targetList.forEach((num, i) => targetIndex.set(num, i));

    const FULL_MASK = (1 << targetList.length) - 1;

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

    // horizontal
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < rows[r].length - 1; c++) {
            makePlacement([rows[r][c], rows[r][c+1]], "H", [r,c]);
        }
    }

    // vertical
    for (let c = 0; c < rows[0].length; c++) {
        makePlacement([rows[0][c], rows[1][c]], "V", [0,c]);
        makePlacement([rows[1][c], rows[2][c]], "V", [1,c]);
    }

    // squares
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
        minPucks: bestCount,
        placements: bestSolution
    };
}

// Add a spin
function addSpin() {
    const input = document.getElementById("spinInput");
    const num = parseInt(input.value);

    if (isNaN(num) || num < 0 || num > 36) {
        input.value = "";
        input.focus();
        return;
    }

    spins.push(num);
    input.value = "";
    input.focus();

    updateAll();
}

// Undo last spin
function undoSpin() {
    if (spins.length === 0) return;

    spins.pop();
    updateAll();
    document.getElementById("spinInput").focus();
}

// Central updater
function updateAll() {
    updateHistory();
    updateSampleStrength();
    updateHeatmap();
    updateBiasStats();
    updatePredictions();
    updateTrendsAndCoverage();
}

// History
function updateHistory() {
    const list = document.getElementById("historyList");
    const lastSpins = spins.slice(-15);
    list.innerHTML = lastSpins.join(", ");
}

// Sample strength
function updateSampleStrength() {
    const el = document.getElementById("sampleStrength");
    const n = spins.length;

    let msg = `Spins: ${n} — `;

    if (n < 30) msg += "Very early / noisy";
    else if (n < 100) msg += "Early data, trends unstable";
    else if (n < 300) msg += "Sector trends forming";
    else if (n < 800) msg += "Sector bias moderately reliable";
    else msg += "Strong dataset";

    el.textContent = msg;
}

// Heatmap
function updateHeatmap() {
    let v = 0, t = 0, o = 0;

    for (let n of spins) {
        if (voisins.includes(n)) v++;
        else if (tiers.includes(n)) t++;
        else if (orphelins.includes(n)) o++;
    }

    const maxVal = Math.max(v, t, o);

    function colour(val) {
        if (val === maxVal && val > 0) return "hot";
        if (val === 0) return "cold";
        return "neutral";
    }

    document.getElementById("heatmapOutput").innerHTML =
        `<span class="${colour(v)}">Voisins: ${v}</span><br>
         <span class="${colour(t)}">Tiers: ${t}</span><br>
         <span class="${colour(o)}">Orphelins: ${o}</span>`;
}

// Bias stats
function updateBiasStats() {
    const out = document.getElementById("biasOutput");

    if (spins.length < 20) {
        out.innerHTML = "Need at least 20 spins.";
        return;
    }

    const expected = spins.length / 37;
    let counts = Array(37).fill(0);

    for (let n of spins) counts[n]++;

    let hot = [];
    let cold = [];

    for (let i = 0; i < 37; i++) {
        if (counts[i] > expected * 1.8) hot.push(i);
        if (counts[i] < expected * 0.4) cold.push(i);
    }

    let chi = 0;
    for (let i = 0; i < 37; i++) {
        chi += Math.pow(counts[i] - expected, 2) / expected;
    }

    out.innerHTML =
        `Hot: ${hot.join(", ") || "None"}<br>
         Cold: ${cold.join(", ") || "None"}<br>
         Bias Score: ${chi.toFixed(2)}`;
}

// Predictions
function updatePredictions() {
    const out = document.getElementById("predictionOutput");

    if (spins.length < 10) {
        out.innerHTML = "Need at least 10 spins.";
        return;
    }

    let counts = Array(37).fill(0);
    for (let n of spins) counts[n]++;

    let scores = Array(37).fill(0);

    for (let i = 0; i < 37; i++) {
        scores[i] = counts[i];
        if (voisins.includes(i)) scores[i] += 0.4;
        if (tiers.includes(i)) scores[i] += 0.3;
        if (orphelins.includes(i)) scores[i] += 0.2;
    }

    let ranked = [...scores]
        .map((v, i) => ({ num: i, score: v }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    out.innerHTML =
        `Top Predictions:<br>
         ${ranked.map(r => r.num).join(", ")}`;
}

// Trends + COVERAGE + PUCKS
function updateTrendsAndCoverage() {
    const trendOut = document.getElementById("trendOutput");
    const covOut = document.getElementById("coverageOutput");

    if (spins.length < 50) {
        trendOut.innerHTML = "No stable trend yet.";
        covOut.innerHTML = "Insufficient data.";
        return;
    }

    let v = 0, t = 0, o = 0;
    for (let n of spins) {
        if (voisins.includes(n)) v++;
        else if (tiers.includes(n)) t++;
        else if (orphelins.includes(n)) o++;
    }

    let sectorTrend =
        v > t && v > o ? "Voisins dominant" :
        t > v && t > o ? "Tiers dominant" :
        o > v && o > t ? "Orphelins dominant" :
        "No clear sector";

    trendOut.innerHTML = sectorTrend;

    // --- PUCK SOLVER HERE ---
    const puckResult = solveMinPucks(boardRows, voisins);

    covOut.innerHTML =
        `<b>Optimal Voisins Coverage</b><br>
         Minimum Pucks: ${puckResult.minPucks}<br><br>` +
        puckResult.placements.map((p, i) =>
            `${i+1}) ${p.type} @ [${p.pos}] → ${p.hits.join(", ")}`
        ).join("<br>");
}

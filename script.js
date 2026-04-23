let spins = [];

// Wheel sectors (European)
const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
const tiers   = [27,13,36,11,30,8,23,10,5,24,16,33];
const orphelins = [1,20,14,31,9,17,34,6];

// Add a spin manually
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

// Generate 1000 random spins
function generateSpins() {
    for (let i = 0; i < 1000; i++) {
        spins.push(Math.floor(Math.random() * 37));
    }
    updateAll();
}

// Clear everything
function clearAll() {
    spins = [];
    updateAll();
    document.getElementById("spinInput").focus();
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
    updateSpinCount();
    updateSampleStrength();
    updateHeatmap();
    updateBiasStats();
    updatePredictions();
    updateTrendsAndCoverage();
}

// Spin count beside Spin Entry
function updateSpinCount() {
    document.getElementById("spinCount").textContent =
        `(${spins.length} spins)`;
}

// One-line, scrollable history (last ~15 spins)
function updateHistory() {
    const list = document.getElementById("historyList");
    const lastSpins = spins.slice(-15);
    list.innerHTML = lastSpins.join(", ");
}

// Sample strength indicator
function updateSampleStrength() {
    const el = document.getElementById("sampleStrength");
    const n = spins.length;

    let msg = `Spins: ${n} — `;

    if (n < 30) msg += "Very early / noisy";
    else if (n < 100) msg += "Early data, trends unstable";
    else if (n < 300) msg += "Sector trends forming";
    else if (n < 800) msg += "Sector bias moderately reliable";
    else msg += "Strong dataset for sector and number analysis";

    el.textContent = msg;
}

// Sector Heatmap
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

// Bias detection (number-level)
function updateBiasStats() {
    const out = document.getElementById("biasOutput");

    if (spins.length < 20) {
        out.innerHTML = "Need at least 20 spins for bias detection.";
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
         Bias Score (Chi²): ${chi.toFixed(2)}`;
}

// Prediction Engine
function updatePredictions() {
    const out = document.getElementById("predictionOutput");

    if (spins.length < 10) {
        out.innerHTML = "Need at least 10 spins for predictions.";
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
         1) ${ranked[0].num}<br>
         2) ${ranked[1].num}<br>
         3) ${ranked[2].num}`;
}

// Trend + Coverage (for movie realism)
function updateTrendsAndCoverage() {
    const trendOut = document.getElementById("trendOutput");
    const covOut = document.getElementById("coverageOutput");

    // ---- TREND (unchanged logic, just no early return) ----
    if (spins.length < 50) {
        trendOut.innerHTML = "No stable trend detected yet.";
    } else {

        let v = 0, t = 0, o = 0;
        for (let n of spins) {
            if (voisins.includes(n)) v++;
            else if (tiers.includes(n)) t++;
            else if (orphelins.includes(n)) o++;
        }

        const total = v + t + o;
        const vPct = (v / total) * 100;
        const tPct = (t / total) * 100;
        const oPct = (o / total) * 100;

        let sectorTrend = "";
        if (vPct > tPct + 8 && vPct > oPct + 8) {
            sectorTrend = "Elevated activity in Voisins du Zero sector.";
        } else if (tPct > vPct + 8 && tPct > oPct + 8) {
            sectorTrend = "Elevated activity in Tiers du Cylindre sector.";
        } else if (oPct > vPct + 8 && oPct > tPct + 8) {
            sectorTrend = "Elevated activity in Orphelins sector.";
        } else {
            sectorTrend = "No dominant sector trend detected.";
        }

        trendOut.innerHTML = sectorTrend;
    }

    // ---- 🔥 PUCK SOLVER (ALWAYS RUNS) ----

    const targets = spins.slice(-17);

    if (targets.length === 0) {
        covOut.innerHTML = "Enter spins to see coverage.";
        return;
    }

    const result = solveMinPucks(boardRows, targets);

    if (!result || result.placements.length === 0) {
        covOut.innerHTML = "No valid coverage found.";
        return;
    }

    covOut.innerHTML =
        `<b>Optimal Coverage (last ${targets.length} spins)</b><br>
         Minimum Pucks: ${result.minPucks}<br><br>` +
        result.placements.map((p,i)=>
            `${i+1}) ${p.type} @ [${p.pos}] → ${p.hits.join(", ")}`
        ).join("<br>");
}

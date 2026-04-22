let spins = [];

// Wheel sectors (European)
const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
const tiers   = [27,13,36,11,30,8,23,10,5,24,16,33];
const orphelins = [1,20,14,31,9,17,34,6];

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

    updateHistory();
    updateHeatmap();
    updateBiasStats();
    updatePredictions();
}

// Undo last spin
function undoSpin() {
    spins.pop();
    updateHistory();
    updateHeatmap();
    updateBiasStats();
    updatePredictions();
    document.getElementById("spinInput").focus();
}

// Update spin history
function updateHistory() {
    const list = document.getElementById("historyList");
    list.textContent = spins.join(", ");
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

// Bias detection
function updateBiasStats() {
    if (spins.length < 20) {
        document.getElementById("biasOutput").innerHTML =
            "Need at least 20 spins for bias detection.";
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

    document.getElementById("biasOutput").innerHTML =
        `Hot: ${hot.join(", ") || "None"}<br>
         Cold: ${cold.join(", ") || "None"}<br>
         Bias Score (Chi²): ${chi.toFixed(2)}`;
}

// Prediction Engine
function updatePredictions() {
    if (spins.length < 10) {
        document.getElementById("predictionOutput").innerHTML =
            "Need at least 10 spins for predictions.";
        return;
    }

    let counts = Array(37).fill(0);
    for (let n of spins) counts[n]++;

    // Weighted score = frequency + sector bonus
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

    document.getElementById("predictionOutput").innerHTML =
        `Top Predictions:<br>
         1) ${ranked[0].num}<br>
         2) ${ranked[1].num}<br>
         3) ${ranked[2].num}`;
}

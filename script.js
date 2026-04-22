let spins = [];

// Wheel sectors (European)
const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
const tiers   = [27,13,36,11,30,8,23,10,5,24,16,33];
const orphelins = [1,20,14,31,9,17,34,6];

// Add a spin
function addSpin() {
    const input = document.getElementById("spinInput");
    const num = parseInt(input.value);

    if (isNaN(num) || num < 0 || num > 36) return;

    spins.push(num);
    input.value = "";

    updateHistory();
    updateSectorStats();
    updateBiasStats();
}

// Update spin history
function updateHistory() {
    const list = document.getElementById("historyList");
    list.textContent = spins.join(", ");
}

// Update sector stats
function updateSectorStats() {
    let v = 0, t = 0, o = 0;

    for (let n of spins) {
        if (voisins.includes(n)) v++;
        else if (tiers.includes(n)) t++;
        else if (orphelins.includes(n)) o++;
    }

    document.getElementById("sectorOutput").innerHTML =
        `Voisins: ${v}<br>Tiers: ${t}<br>Orphelins: ${o}`;
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

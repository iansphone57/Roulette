let spins = [];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  if (id === 'analysis') runAnalysis();
}

function addSpin() {
  const input = document.getElementById('spinInput');
  const n = parseInt(input.value);

  if (!isNaN(n) && n >= 0 && n <= 36) {
    spins.push(n);
    document.getElementById('spinCount').innerText =
      "Collected: " + spins.length;
    input.value = "";
  }
}

function runAnalysis() {
  if (spins.length === 0) {
    document.getElementById('analysisText').innerText = "No data yet.";
    return;
  }

  const freq = {};
  for (let i = 0; i <= 36; i++) freq[i] = 0;
  spins.forEach(n => freq[n]++);

  const avg = spins.length / 37;
  let biasDetected = false;

  for (let n = 0; n <= 36; n++) {
    if (Math.abs(freq[n] - avg) > avg * 0.30) {
      biasDetected = true;
      break;
    }
  }

  let result = "";

  if (!biasDetected) {
    result = "No detectable bias. Use standard low‑risk strategies.";
  } else {
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    result = "Bias detected.\nBest numbers: " + sorted.join(", ") +
             "\nRecommended: Bet these numbers and their neighbours.";
  }

  document.getElementById('analysisText').innerText = result;
}

let spins = [];

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

function updateHistory() {
    const list = document.getElementById("historyList");
    list.textContent = spins.join(", ");
}

const voisins = [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25];
const tiers   = [27,13,36,11,30,8,23,10,5,24,16,33];
const orphelins = [1,20,14,31,9,17,34,6];

function updateSectorStats() {
    let v = 0, t = 0, o = 0;

    for (let n of spins) {
        if (voisins.includes(n)) v++;
        else if (tiers.includes(n)) t++;
        else if (orphelins.includes(n)) o++;
    }

    console.log("Sector Stats → Voisins:", v, "Tiers:", t, "Orphelins:", o);
}

function updateBiasStats() {
    if (spins.length < 20) return; // need minimum data

    const expected = spins.length / 37;
    let counts = Array(37).fill(0);

    for (let n of spins) counts[n]++;

    let hot = [];
    let cold = [];

    for (let i = 0; i < 37; i++) {
        if (counts[i] > expected * 1.8) hot.push(i);
        if (counts[i] < expected * 0.4) cold.push(i);
    }

    console.log("Hot numbers:", hot);
    console.log("Cold numbers:", cold);

    // Chi-square bias test
    let chi = 0;
    for (let i = 0; i < 37; i++) {
        chi += Math.pow(counts[i] - expected, 2) / expected;
    }

    console.log("Bias Score (Chi²):", chi.toFixed(2));
}





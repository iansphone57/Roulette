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

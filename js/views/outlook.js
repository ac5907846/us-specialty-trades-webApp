// Market outlook: harmonised Markov transition matrices turned into an
// interactive "where does a market like yours go next?" tool.

import { data } from "../data.js";
import { palette, TRADES } from "../config.js";
import { fmtPct } from "../format.js";

const CAT_LABEL = {
  "<3": "under 3 establishments",
  "3-4": "3–4 establishments",
  "5-19": "5–19 establishments",
  "20-99": "20–99 establishments",
  "100+": "100 or more establishments",
};

let chart = null;

function drawBars(cats, probs, fromCat) {
  const p = palette();
  const el = document.getElementById("chOutlook");
  if (!el) return;
  if (chart) { chart.destroy(); chart = null; }
  chart = new Chart(el, {
    type: "bar",
    data: {
      labels: cats,
      datasets: [{
        label: "Probability, %",
        data: probs.map((v) => v * 100),
        backgroundColor: cats.map((c) =>
          c === fromCat ? p.cobalt : p.cobaltSoft),
        borderColor: cats.map((c) => (c === fromCat ? p.cobalt : "transparent")),
        borderWidth: 1.5,
        borderRadius: 4,
        maxBarThickness: 60,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: p.surface, titleColor: p.text1, bodyColor: p.text2,
          borderColor: p.grid, borderWidth: 1, padding: 10,
          callbacks: { label: (c) => ` ${c.parsed.y.toFixed(1)}% of counties` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: p.text2, font: { size: 13 } },
             border: { color: p.grid },
             title: { display: true, text: "Size class at the end of the window", color: p.text3, font: { size: 11 } } },
        y: { grid: { color: p.grid }, border: { display: false },
             ticks: { color: p.text3, callback: (v) => v + "%" },
             max: 100 },
      },
    },
  });
}

function explain(cats, probs, fromCat, era, counties) {
  const stay = probs[cats.indexOf(fromCat)];
  const iFrom = cats.indexOf(fromCat);
  const up = probs.slice(iFrom + 1).reduce((a, b) => a + b, 0);
  const down = probs.slice(0, iFrom).reduce((a, b) => a + b, 0);
  const spanYears = era === "2017-2023" ? 6 : 9;
  let headline;
  if (fromCat === "100+") {
    headline = `Large county markets are extraordinarily durable: ${fmtPct(stay * 100)} stayed in the top class across this window. In the research paper, the rare apparent exits in 2017–2023 are county-boundary changes (Connecticut), not market collapse.`;
  } else if (stay >= 0.75) {
    headline = `Markets this size are sticky: ${fmtPct(stay * 100)} were still in the same class ${spanYears} years later, ${fmtPct(up * 100)} moved up, and ${fmtPct(down * 100)} slipped down.`;
  } else {
    headline = `Small markets churn: only ${fmtPct(stay * 100)} were still in this class ${spanYears} years later; ${fmtPct(up * 100)} grew into a larger class and ${fmtPct(down * 100)} fell below it.`;
  }
  return `${headline} <span class="muted">(${counties.toLocaleString()} counties, ${era.replace("-", "–")}, harmonised to the post-2017 disclosure floor.)</span>`;
}

export function render() {
  const tr = data.transitions;
  const trade = document.getElementById("oTrade").value;
  const era = document.getElementById("oEra").value;
  const fromCat = document.getElementById("oClass").value;

  const cats = tr.cats;
  const { M, counties } = tr.trades[trade][era];
  const row = M[cats.indexOf(fromCat)];

  drawBars(cats, row, fromCat);
  document.getElementById("oVerdict").innerHTML =
    explain(cats, row, fromCat, era, counties);

  // persistence strip across eras
  const strip = tr.eras.map((e) => {
    const m = tr.trades[trade][e];
    const stay = m.M[cats.indexOf(fromCat)][cats.indexOf(fromCat)];
    return `<div class="mini-stat"><div class="k">${e.replace("-", "–")}</div>
      <div class="v">${(stay * 100).toFixed(0)}%</div>
      <div class="d">stayed in class</div></div>`;
  }).join("");
  document.getElementById("oStrip").innerHTML = strip;
}

export function init() {
  const oc = document.getElementById("oClass");
  oc.innerHTML = data.transitions.cats
    .map((c) => `<option value="${c}" ${c === "5-19" ? "selected" : ""}>${CAT_LABEL[c]}</option>`)
    .join("");
  const ot = document.getElementById("oTrade");
  ot.innerHTML = Object.entries(TRADES)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  for (const id of ["oTrade", "oEra", "oClass"]) {
    document.getElementById(id).addEventListener("change", render);
  }
}

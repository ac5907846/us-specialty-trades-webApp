// Survival outlook: compound observed BDS dissolution rates into
// survival odds over a chosen horizon.

import { lineChart } from "../charts.js";
import { data } from "../data.js";
import { fmtPct, fmtInt } from "../format.js";

const $ = (id) => document.getElementById(id);
const NAMES = { small: "a firm with under 20 employees",
                mid: "a firm with 20-499 employees",
                large: "a firm with 500+ employees" };
let survChart = null;

function recentRate(group) {
  const r = data.dynamism.death[group].rate;
  const lastFive = r.slice(-5);
  return lastFive.reduce((a, b) => a + b, 0) / lastFive.length;
}

function update() {
  const group = $("sGroup").value;
  const horizon = Number($("sHorizon").value);
  $("sHorizonLabel").textContent = horizon;
  const rate = recentRate(group);
  const surv = Math.pow(1 - rate / 100, horizon) * 100;
  const d = data.dynamism.death[group];
  const firmsNow = d.firms[d.firms.length - 1];

  const box = $("sVerdict");
  box.className = "verdict " + (surv >= 80 ? "good" : surv >= 45 ? "warn" : "bad");
  box.innerHTML = `<strong>${surv.toFixed(0)}% survive ${horizon} years.</strong>
    At the recent dissolution rate of ${rate.toFixed(1)}% per year,
    ${NAMES[group]} in building equipment contracting has a
    ${(100 - surv).toFixed(0)}% chance of closing for good within ${horizon} years.
    <span class="muted">${fmtInt(firmsNow)} such firms existed in 2023. Baseline uses the
    2019-2023 mean; acquisition is not counted as death.</span>`;

  if (survChart) survChart.destroy();
  const years = Array.from({ length: 26 }, (_, i) => i);
  const css = getComputedStyle(document.documentElement);
  const cobalt = css.getPropertyValue("--cobalt").trim();
  const amber = css.getPropertyValue("--amber").trim();
  const grid = css.getPropertyValue("--grid").trim();
  const t3 = css.getPropertyValue("--text-3").trim();
  const curve = years.map(h => Math.pow(1 - rate / 100, h) * 100);
  survChart = new Chart($("chSurvival"), {
    type: "line",
    data: { datasets: [{
      label: "Share of firms still operating, %",
      data: years.map((h, i) => ({ x: h, y: curve[i] })),
      borderColor: cobalt, borderWidth: 2.2, pointRadius: 0,
      pointHoverRadius: 4, fill: false, tension: 0.2,
    }, {
      label: "Chosen horizon",
      data: [{ x: horizon, y: Math.pow(1 - rate / 100, horizon) * 100 }],
      borderColor: amber, backgroundColor: amber,
      pointRadius: 6, pointHoverRadius: 7, showLine: false,
    }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(1)}% after ${c.parsed.x} years` } } },
      scales: {
        x: { type: "linear", title: { display: true, text: "years from now", color: t3 },
             ticks: { color: t3 }, grid: { display: false } },
        y: { min: 0, max: 100, ticks: { color: t3, callback: v => v + "%" },
             grid: { color: grid } },
      },
    },
  });
}

export function render() {
  const dyn = data.dynamism;
  $("sGroup").onchange = update;
  $("sHorizon").oninput = update;
  update();

  lineChart("chDeath", [
    { label: "Under 20 employees", years: dyn.death.small.years, values: dyn.death.small.rate, color: p => p.cobalt },
    { label: "20-499", years: dyn.death.mid.years, values: dyn.death.mid.rate, color: p => p.green },
    { label: "500+", years: dyn.death.large.years, values: dyn.death.large.rate, color: p => p.amber },
  ], { percent: true });

  lineChart("chAging", [
    { label: "Aged 0-5 years", years: dyn.ageYears, values: dyn.young, color: p => p.cobalt },
    { label: "Aged 16+ years", years: dyn.ageYears, values: dyn.mature, color: p => p.rose },
  ], { percent: true });
}

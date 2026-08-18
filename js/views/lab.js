// Consolidation lab: three interactive "implications" tools built directly
// from the paper's estimates.
//  1. Pay-dispersion simulator - the location-scale model made tangible.
//  2. Consolidation projection - mechanical extrapolation of the 500+ share.
//  3. Succession clock - BDS dissolution rates turned into survival odds
//     for the whole small-firm stock.

import { data } from "../data.js";
import { palette, TRADES } from "../config.js";
import { fmtInt, fmtPct, fmtSigned } from "../format.js";

const registry = [];
function fresh(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const old = registry.find((c) => c.canvas === el);
  if (old) { old.destroy(); registry.splice(registry.indexOf(old), 1); }
  return el;
}

const Z = { p10: -1.2816, p25: -0.6745, p50: 0, p75: 0.6745, p90: 1.2816 };

function normPdf(x, mu, s) {
  return Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
}

// ---- 1. dispersion simulator ------------------------------------------
function renderSim() {
  const p = palette();
  const trade = document.getElementById("labTrade").value;
  const dpp = Number(document.getElementById("labShare").value);
  document.getElementById("labShareOut").textContent = `+${dpp} pp`;
  const { bMu, bSig, sigma } = data.implications.locscale[trade];
  const s1 = sigma * Math.exp(bSig * dpp / 100);
  const muShift = bMu * dpp / 100;

  const xs = [];
  for (let x = -0.55; x <= 0.5501; x += 0.01) xs.push(x);
  const base = xs.map((x) => normPdf(x, 0, sigma));
  const cons = xs.map((x) => normPdf(x, muShift, s1));

  const el = fresh("chLabDist");
  if (el) {
    const chart = new Chart(el, {
      type: "line",
      data: {
        labels: xs.map((x) => (x * 100).toFixed(0)),
        datasets: [
          { label: "Baseline county", data: base, borderColor: p.text3,
            borderDash: [5, 4], borderWidth: 1.6, pointRadius: 0, fill: true,
            backgroundColor: p.graySoft ?? "rgba(140,145,160,0.10)", tension: 0.3 },
          { label: `Same county, share +${dpp} pp`, data: cons,
            borderColor: p.cobalt, borderWidth: 2.4, pointRadius: 0,
            fill: false, tension: 0.3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: p.text2, usePointStyle: true, pointStyle: "line", boxWidth: 22, boxHeight: 2 } },
          tooltip: { enabled: false },
        },
        scales: {
          x: { grid: { display: false }, border: { color: p.grid },
               ticks: { color: p.text3, maxTicksLimit: 9 },
               title: { display: true, text: "County wage premium, log points", color: p.text3, font: { size: 11 } } },
          y: { display: false },
        },
      },
    });
    registry.push(chart);
  }

  const eff = (q) => (bMu + Z[q] * sigma * bSig) * dpp; // log points
  const rows = [["p10", "10th percentile county"], ["p50", "median county"], ["p90", "90th percentile county"]]
    .map(([q, lab]) => {
      const v = eff(q);
      const cls = Math.abs(v) < 0.25 ? "" : v > 0 ? "up" : "down";
      const txt = Math.abs(v) < 0.05 ? "≈0" : fmtSigned(v, 1);
      return `<div class="mini-stat"><div class="k">${lab}</div>
        <div class="v ${cls}">${txt}</div>
        <div class="d">log points of premium</div></div>`;
    }).join("");
  document.getElementById("labQuants").innerHTML = rows;
  document.getElementById("labSimNote").innerHTML =
    `Estimates from the 1998–2016 hierarchical location-scale model: mean effect ${fmtSigned(bMu, 3)} (indistinguishable from zero), ` +
    `dispersion effect +${bSig.toFixed(2)} on log σ (p &lt; 0.005). A +${dpp} pp rise in the large-establishment share multiplies ` +
    `the spread of county premia by <b>×${Math.exp(bSig * dpp / 100).toFixed(3)}</b> while the centre stays put. ` +
    `This is a description of cross-market dispersion, not a wage forecast for any worker.`;
}

// ---- 2. consolidation projection ---------------------------------------
function renderProj() {
  const p = palette();
  const trade = document.getElementById("labTrade").value;
  const pace = Number(document.getElementById("labPace").value) / 100;
  document.getElementById("labPaceOut").textContent =
    `${(pace).toFixed(2)} pp/yr`;
  const ov = data.overview[trade];
  const base = data.implications.sh500[trade];

  const histYears = ov.years, hist = ov.sh500;
  const projYears = [], proj = [];
  for (let y = base.lastYear; y <= 2035; y++) {
    projYears.push(y);
    proj.push(Math.min(60, base.last + pace * (y - base.lastYear)));
  }
  const el = fresh("chLabProj");
  if (el) {
    const chart = new Chart(el, {
      type: "line",
      data: {
        datasets: [
          { label: "Observed (SUSB)", data: histYears.map((y, i) => ({ x: y, y: hist[i] })),
            borderColor: p.cobalt, borderWidth: 2.2, pointRadius: 0, tension: 0.25 },
          { label: "Extrapolation", data: projYears.map((y, i) => ({ x: y, y: proj[i] })),
            borderColor: p.amber, borderWidth: 2, borderDash: [6, 4], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: p.text2, usePointStyle: true, pointStyle: "line", boxWidth: 22, boxHeight: 2 } },
          tooltip: { backgroundColor: p.surface, titleColor: p.text1, bodyColor: p.text2, borderColor: p.grid, borderWidth: 1 },
        },
        scales: {
          x: { type: "linear", grid: { display: false }, border: { color: p.grid },
               ticks: { color: p.text3, callback: (v) => String(v), maxTicksLimit: 9 } },
          y: { grid: { color: p.grid }, border: { display: false },
               ticks: { color: p.text3, callback: (v) => v + "%" },
               title: { display: true, text: "Employment share of firms with 500+ employees", color: p.text3, font: { size: 11 } } },
        },
      },
    });
    registry.push(chart);
  }
  const at2030 = base.last + pace * (2030 - base.lastYear);
  const at2035 = base.last + pace * (2035 - base.lastYear);
  document.getElementById("labProjNote").innerHTML =
    `At ${pace.toFixed(2)} pp per year (the observed 2012–${base.lastYear} pace is ` +
    `${data.implications.sh500[trade].trendPerYear.toFixed(2)} pp/yr), the 500+ share reaches ` +
    `<b>${at2030.toFixed(1)}%</b> by 2030 and <b>${at2035.toFixed(1)}%</b> by 2035, against 10-11% through the entire 1998-2012 period. ` +
    `A mechanical extrapolation, not a forecast: the 1997–2002 first wave shows consolidation can also reverse.`;
}

// ---- 3. succession clock -------------------------------------------------
function renderClock() {
  const p = palette();
  const horizon = Number(document.getElementById("labHorizon").value);
  document.getElementById("labHorizonOut").textContent = `${horizon} years`;
  const d = data.implications.death;

  const groups = [
    ["small", "Under 20 employees", p.cobalt],
    ["mid", "20–499 employees", p.green],
    ["large", "500+ employees", p.amber],
  ];
  const surv = groups.map(([k]) =>
    Math.pow(1 - d[k].rate2017_23 / 100, horizon));

  const el = fresh("chLabClock");
  if (el) {
    const chart = new Chart(el, {
      type: "bar",
      data: {
        labels: groups.map((g) => g[1]),
        datasets: [
          { label: "Still operating", data: surv.map((s) => s * 100),
            backgroundColor: p.cobaltSoft, borderColor: p.cobalt,
            borderWidth: 1.5, borderRadius: 4, maxBarThickness: 70 },
          { label: "Dissolved", data: surv.map((s) => (1 - s) * 100),
            backgroundColor: "rgba(169,36,88,0.18)", borderColor: p.rose,
            borderWidth: 1.5, borderRadius: 4, maxBarThickness: 70 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: p.text2 } },
          tooltip: {
            backgroundColor: p.surface, titleColor: p.text1, bodyColor: p.text2,
            borderColor: p.grid, borderWidth: 1,
            callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y.toFixed(1)}%` },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: p.text2 }, border: { color: p.grid } },
          y: { stacked: true, max: 100, grid: { color: p.grid }, border: { display: false },
               ticks: { color: p.text3, callback: (v) => v + "%" } },
        },
      },
    });
    registry.push(chart);
  }
  const dying = Math.round(d.small.firms2023 * (1 - surv[0]));
  document.getElementById("labClockNote").innerHTML =
    `At the 2017–2023 average dissolution rates (${fmtPct(d.small.rate2017_23)}/yr under 20 employees, ` +
    `${fmtPct(d.mid.rate2017_23)}/yr for 20–499, 0%/yr for 500+), <b>${fmtInt(dying)}</b> of today's ` +
    `${fmtInt(d.small.firms2023)} small building-equipment contractors would wind down within ${horizon} years, ` +
    `and essentially none of the ${fmtInt(d.large.firms2023)} largest. No firm with 500+ employees has dissolved ` +
    `in any year since 1978: at the top of the industry, exit means acquisition, not closure. ` +
    `Rates are population averages; any one firm's odds depend on age, market, and management.`;
}

export function render() {
  renderSim();
  renderProj();
  renderClock();
}

export function init() {
  const lt = document.getElementById("labTrade");
  lt.innerHTML = Object.entries(TRADES)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  document.getElementById("labTrade").addEventListener("change", render);
  document.getElementById("labShare").addEventListener("input", renderSim);
  document.getElementById("labPace").addEventListener("input", renderProj);
  document.getElementById("labHorizon").addEventListener("input", renderClock);
  // default pace = observed trend
  document.getElementById("labPace").value =
    Math.round(data.implications.sh500.electrical.trendPerYear * 100);
}

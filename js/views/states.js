// State explorer: one state's trade series against the national line.

import { lineChart, destroyAll } from "../charts.js";
import { data } from "../data.js";
import { STATE_NAMES, TRADES } from "../config.js";
import { fmtInt, fmtUsd, fmtSigned, fmtPct } from "../format.js";

const $ = (id) => document.getElementById(id);
let charts = [];

function national(trade, key) {
  // employment-weighted national series computed across states
  const st = data.states[trade];
  const years = {};
  for (const rec of Object.values(st)) {
    rec.years.forEach((y, i) => {
      if (!years[y]) years[y] = { wsum: 0, w: 0 };
      const wt = rec.emp[i] || 1;
      years[y].wsum += (rec[key][i]) * wt;
      years[y].w += wt;
    });
  }
  const ys = Object.keys(years).map(Number).sort((a, b) => a - b);
  return { years: ys, values: ys.map(y => years[y].wsum / years[y].w) };
}

function tile(accent, k, v, d) {
  return `<div class="tile" style="--tile-accent: var(--${accent})">
    <div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div>
  </div>`;
}

function update() {
  const trade = $("stTrade").value;
  const st = $("stState").value;
  const rec = data.states[trade][st];
  if (!rec) return;
  const li = rec.years.length - 1;

  $("stTiles").innerHTML =
    tile("cobalt", `Establishments, ${rec.years[li]}`, fmtInt(rec.est[li]),
         `${fmtInt(rec.emp[li])} employees in published counties`) +
    tile("green", "Average pay", fmtUsd(rec.pay[li]),
         `${TRADES[trade]}, ${STATE_NAMES[st]}`) +
    tile("amber", "Wage premium", `${fmtSigned(rec.premium[li])} lp`,
         "vs the average job in the same counties") +
    tile("rose", "Large-establishment share", fmtPct(rec.shlg[li]),
         "trade employment in establishments with 100+ staff");

  charts.forEach(c => c && c.destroy());
  charts = [];
  const natPay = national(trade, "pay");
  const natPrem = national(trade, "premium");
  const natShlg = national(trade, "shlg");
  const stName = STATE_NAMES[st] ?? st;

  charts.push(lineChart("chStEst", [
    { label: stName, years: rec.years, values: rec.est, color: p => p.cobalt },
  ]));
  charts.push(lineChart("chStPay", [
    { label: stName, years: rec.years, values: rec.pay, color: p => p.cobalt },
    { label: "National", years: natPay.years, values: natPay.values, color: p => p.text3, dashed: true, width: 1.4 },
  ], { money: true }));
  charts.push(lineChart("chStPrem", [
    { label: stName, years: rec.years, values: rec.premium, color: p => p.cobalt },
    { label: "National", years: natPrem.years, values: natPrem.values, color: p => p.text3, dashed: true, width: 1.4 },
  ]));
  charts.push(lineChart("chStShlg", [
    { label: stName, years: rec.years, values: rec.shlg, color: p => p.cobalt },
    { label: "National", years: natShlg.years, values: natShlg.values, color: p => p.text3, dashed: true, width: 1.4 },
  ], { percent: true }));
}

export function render() {
  const stSel = $("stState");
  const states = Object.keys(data.states.electrical).sort();
  stSel.innerHTML = states
    .map(s => `<option value="${s}" ${s === "FL" ? "selected" : ""}>${STATE_NAMES[s] ?? s}</option>`)
    .join("");
  $("stTrade").onchange = update;
  stSel.onchange = update;
  update();
}

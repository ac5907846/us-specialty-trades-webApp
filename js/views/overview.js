// Industry pulse: headline tiles + four trend charts.

import { lineChart } from "../charts.js";
import { data } from "../data.js";
import { fmtInt, fmtUsd, fmtPct } from "../format.js";

function tile(accent, k, v, d) {
  return `<div class="tile" style="--tile-accent: var(--${accent})">
    <div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div>
  </div>`;
}

export function render() {
  const ov = data.overview;
  const dyn = data.dynamism;
  const el = ov.electrical, pl = ov.plumbing_hvac;

  const last = el.years.length - 1;
  const sh0 = el.sh500[0], sh1 = el.sh500[last];
  const r2 = (v) => (Math.round(v * 100) / 100).toFixed(2);   // half-up
  const alpha1 = el.alpha[el.alpha.length - 1];
  const pay1 = el.pay[el.pay.length - 1];
  const entryNow = dyn.entry[dyn.entry.length - 1];
  const matureNow = dyn.mature[dyn.mature.length - 1];

  document.getElementById("statTiles").innerHTML =
    tile("cobalt", "Employment in 500+ firms, electrical",
         fmtPct(sh1), `<span class="up">&#9650; from ${fmtPct(sh0)}</span> in 1998`) +
    tile("cobalt", "Tail exponent (Zipf = 1.0)",
         r2(alpha1), `<span class="down">&#9660; from ${r2(el.alpha[0])}</span> in 2002; heavier tail`) +
    tile("green", "Average pay per employee, 2023",
         fmtUsd(pay1), `electrical; ${fmtUsd(el.pay[0])} in 1998`) +
    tile("amber", "Firms aged 16+ years",
         fmtPct(matureNow), `entry rate now ${fmtPct(entryNow)}, was 15.5% in the 1970s`);

  lineChart("chShares", [
    { label: "Electrical, 500+", years: el.years, values: el.sh500, color: p => p.cobalt },
    { label: "Plumbing/HVAC, 500+", years: pl.years, values: pl.sh500, color: p => p.green },
    { label: "Electrical, under 20", years: el.years, values: el.shLt20, color: p => p.cobalt, dashed: true, width: 1.4 },
    { label: "Plumbing/HVAC, under 20", years: pl.years, values: pl.shLt20, color: p => p.green, dashed: true, width: 1.4 },
  ], { percent: true });

  lineChart("chAlpha", [
    { label: "CI hi", years: el.alphaYears, values: el.alphaHi, color: () => "transparent", soft: p => p.cobaltSoft },
    { label: "CI lo", years: el.alphaYears, values: el.alphaLo, color: () => "transparent", soft: p => p.cobaltSoft, fill: "-1" },
    { label: "Electrical", years: el.alphaYears, values: el.alpha, color: p => p.cobalt },
    { label: "Plumbing/HVAC", years: pl.alphaYears, values: pl.alpha, color: p => p.green },
    { label: "Zipf benchmark", years: [el.alphaYears[0], el.alphaYears.at(-1)], values: [1, 1], color: p => p.text3, dashed: true, width: 1.2 },
  ], { legendFilter: (i) => !i.text.startsWith("CI") });

  lineChart("chEntry", [
    { label: "Entry, 2382", years: dyn.years, values: dyn.entry, color: p => p.cobalt },
    { label: "Exit, 2382", years: dyn.years, values: dyn.exit, color: p => p.green },
    { label: "Entry, all sectors", years: dyn.econYears, values: dyn.econEntry, color: p => p.text3, dashed: true, width: 1.4 },
  ], { percent: true });

  lineChart("chPay", [
    { label: "Electrical", years: el.payYears, values: el.pay, color: p => p.cobalt },
    { label: "Plumbing/HVAC", years: pl.payYears, values: pl.pay, color: p => p.green },
  ], { money: true });
}

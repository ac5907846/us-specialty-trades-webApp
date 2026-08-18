// Wage benchmark tool: place an hourly wage in the official OEWS
// percentile distribution for a trade occupation in a state and year.

import { bandChart, lineChart } from "../charts.js";
import { data } from "../data.js";
import { OCCS, STATE_NAMES } from "../config.js";
import { fmtUsd2, ordinal, fmtInt } from "../format.js";

const $ = (id) => document.getElementById(id);
let charts = { dist: null, time: null };

// piecewise-linear percentile placement between published cut points
function placement(w, r, i) {
  const pts = [[10, r.p10[i]], [25, r.p25[i]], [50, r.p50[i]],
               [75, r.p75[i]], [90, r.p90[i]]];
  if (w < pts[0][1]) return { kind: "below", pct: 10 };
  if (w >= pts[4][1]) return { kind: "above", pct: 90 };
  for (let k = 0; k < 4; k++) {
    const [pa, wa] = pts[k], [pb, wb] = pts[k + 1];
    if (w >= wa && w < wb) {
      const pct = pa + (pb - pa) * (w - wa) / (wb - wa);
      return { kind: "in", pct: Math.round(pct) };
    }
  }
  return { kind: "in", pct: 50 };
}

function update() {
  const occ = $("wOcc").value;
  const st = $("wState").value;
  const year = Number($("wYear").value);
  const wage = Number($("wWage").value);
  const rec = data.oews.state[occ][st];
  const i = rec.years.indexOf(year);
  if (i < 0) return;

  const res = placement(wage, rec, i);
  const box = $("wVerdict");
  const occName = OCCS[occ], stName = STATE_NAMES[st];
  const emp = rec.emp[i] ? `${fmtInt(rec.emp[i])} ${occName.toLowerCase()} employed statewide.` : "";
  if (res.kind === "below") {
    box.className = "verdict bad";
    box.innerHTML = `<strong>Below the 10th percentile.</strong> ${fmtUsd2(wage)}/hr is under the
      ${fmtUsd2(rec.p10[i])} that 90% of ${occName.toLowerCase()} in ${stName} earned in ${year}.
      <span class="muted">${emp}</span>`;
  } else if (res.kind === "above") {
    box.className = "verdict good";
    box.innerHTML = `<strong>Above the 90th percentile.</strong> ${fmtUsd2(wage)}/hr beats the
      ${fmtUsd2(rec.p90[i])} top-decile threshold for ${occName.toLowerCase()} in ${stName}, ${year}.
      <span class="muted">${emp}</span>`;
  } else {
    box.className = "verdict" + (res.pct >= 50 ? " good" : res.pct < 25 ? " warn" : "");
    box.innerHTML = `<strong>&asymp; ${ordinal(res.pct)} percentile.</strong> ${fmtUsd2(wage)}/hr for
      ${occName.toLowerCase()} in ${stName}, ${year}. State median ${fmtUsd2(rec.p50[i])};
      the middle half earned ${fmtUsd2(rec.p25[i])}-${fmtUsd2(rec.p75[i])}.
      <span class="muted">${emp}</span>`;
  }

  // distribution "ladder" for the selected year, as a labelled bar set
  if (charts.dist) charts.dist.destroy();
  const p = ["p10", "p25", "p50", "p75", "p90"];
  const canvas = $("chWage");
  const css = getComputedStyle(document.documentElement);
  const cobalt = css.getPropertyValue("--cobalt").trim();
  const amber = css.getPropertyValue("--amber").trim();
  const grid = css.getPropertyValue("--grid").trim();
  const t2 = css.getPropertyValue("--text-2").trim();
  const t3 = css.getPropertyValue("--text-3").trim();
  charts.dist = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["10th", "25th", "Median", "75th", "90th"],
      datasets: [{
        label: `${year} hourly wage`,
        data: p.map(k => rec[k][i]),
        backgroundColor: p.map(k =>
          wage >= rec[k][i] ? cobalt : grid),
        borderRadius: 6, maxBarThickness: 72,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` $${c.parsed.y.toFixed(2)}/hr` } },
        annotationLine: false,
      },
      scales: {
        x: { ticks: { color: t2 }, grid: { display: false } },
        y: { ticks: { color: t3, callback: v => "$" + v }, grid: { color: grid } },
      },
    },
    plugins: [{
      id: "wageLine",
      afterDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const y = scales.y.getPixelForValue(wage);
        if (y < chartArea.top || y > chartArea.bottom) return;
        ctx.save();
        ctx.strokeStyle = amber; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
        ctx.fillStyle = amber; ctx.font = "600 12px system-ui";
        ctx.fillText(`your wage $${wage.toFixed(2)}`, chartArea.left + 6, y - 6);
        ctx.restore();
      },
    }],
  });

  // time band
  if (charts.time) charts.time.destroy();
  charts.time = bandChart("chWageTime", rec.years,
    { p10: rec.p10, p25: rec.p25, p50: rec.p50, p75: rec.p75, p90: rec.p90 },
    wage, "Your wage", { money: true });
}

export function render() {
  const occSel = $("wOcc"), stSel = $("wState"), yrSel = $("wYear");
  occSel.innerHTML = Object.entries(OCCS)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  const states = Object.keys(data.oews.state["47-2111"]).sort();
  stSel.innerHTML = states
    .map(s => `<option value="${s}" ${s === "FL" ? "selected" : ""}>${STATE_NAMES[s] ?? s}</option>`)
    .join("");
  const fillYears = () => {
    const rec = data.oews.state[occSel.value][stSel.value];
    yrSel.innerHTML = [...rec.years].reverse()
      .map(y => `<option value="${y}">${y}</option>`).join("");
  };
  fillYears();
  occSel.onchange = () => { fillYears(); update(); };
  stSel.onchange = () => { fillYears(); update(); };
  yrSel.onchange = update;
  $("wWage").oninput = update;
  update();
}

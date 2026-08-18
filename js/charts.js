// Chart.js factory helpers. One place defines the look of every chart:
// thin 2px lines, no point markers until hover, recessive grid, tooltips on.

import { palette } from "./config.js";

const registry = [];   // live charts, destroyed and rebuilt on theme change

export function destroyAll() {
  while (registry.length) registry.pop().destroy();
}

function baseOptions(p, { yTitle = "", percent = false, money = false, legendFilter = null } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", axis: "x", intersect: false },
    plugins: {
      legend: {
        display: true,
        labels: { color: p.text2, usePointStyle: true, pointStyle: "line",
                  boxWidth: 22, boxHeight: 2, font: { size: 12 },
                  filter: legendFilter ?? undefined },
      },
      tooltip: {
        backgroundColor: p.surface, titleColor: p.text1, bodyColor: p.text2,
        borderColor: p.grid, borderWidth: 1, padding: 10,
        callbacks: money ? {
          label: (c) => `${c.dataset.label}: $${Number(c.parsed.y).toLocaleString()}`,
        } : undefined,
      },
    },
    scales: {
      x: {
        type: "linear",
        ticks: { color: p.text3, maxTicksLimit: 8, callback: (v) => String(v) },
        grid: { display: false },
        border: { color: p.grid },
      },
      y: {
        ticks: {
          color: p.text3,
          callback: (v) => money ? "$" + Number(v).toLocaleString()
                     : percent ? v + "%" : Number(v).toLocaleString(),
        },
        grid: { color: p.grid },
        border: { display: false },
        title: yTitle ? { display: true, text: yTitle, color: p.text3, font: { size: 11 } } : undefined,
      },
    },
  };
}

function xy(years, values) {
  return years.map((yr, i) => ({ x: yr, y: values[i] }));
}

// series: [{label, years, values, color, dashed, fill, soft, hidden}]
export function lineChart(canvasId, series, opts = {}) {
  const p = palette();
  const el = document.getElementById(canvasId);
  if (!el) return null;
  const datasets = series.map((s) => ({
    label: s.label,
    data: xy(s.years, s.values),
    borderColor: s.color(p),
    backgroundColor: s.soft ? s.soft(p) : "transparent",
    borderWidth: s.width ?? 2,
    borderDash: s.dashed ? [5, 4] : undefined,
    pointRadius: 0,
    pointHoverRadius: 4,
    fill: s.fill ?? false,
    tension: 0.25,
    hidden: s.hidden ?? false,
  }));
  const chart = new Chart(el, {
    type: "line",
    data: { datasets },
    options: baseOptions(p, opts),
  });
  registry.push(chart);
  return chart;
}

// Percentile band: p10-p90 shaded, p25-p75 darker, median line, plus an
// optional horizontal marker for the user's own value.
export function bandChart(canvasId, years, bands, markerValue, markerLabel, opts = {}) {
  const p = palette();
  const el = document.getElementById(canvasId);
  if (!el) return null;
  const mk = (label, vals, color, fillTo, width = 1) => ({
    label, data: xy(years, vals), borderColor: color,
    backgroundColor: p.cobaltSoft, borderWidth: width, pointRadius: 0,
    pointHoverRadius: 3, fill: fillTo, tension: 0.25,
  });
  const datasets = [
    mk("p90", bands.p90, "transparent", false),
    mk("p75", bands.p75, "transparent", "-1"),
    mk("Median", bands.p50, p.cobalt, false, 2.2),
    mk("p25", bands.p25, "transparent", false),
    mk("p10", bands.p10, "transparent", "-1"),
  ];
  if (markerValue != null) {
    datasets.push({
      label: markerLabel,
      data: xy(years, years.map(() => markerValue)),
      borderColor: p.amber, borderWidth: 2, borderDash: [6, 4],
      pointRadius: 0, fill: false,
    });
  }
  const options = baseOptions(p, opts);
  options.plugins.legend.labels.filter = (item) =>
    !["p90", "p75", "p25", "p10"].includes(item.text);
  const chart = new Chart(el, { type: "line", data: { datasets }, options });
  registry.push(chart);
  return chart;
}

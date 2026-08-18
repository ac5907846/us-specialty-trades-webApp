// About: what this site is, sources, downloads, paper and code links.

import { data } from "../data.js";

const SOURCES = [
  ["Statistics of US Businesses (SUSB)", "Census Bureau", "1998–2022",
   "firms by enterprise employment-size class", "size distribution, tail exponents"],
  ["County Business Patterns (CBP)", "Census Bureau", "1998–2023",
   "establishments, employment, payroll by county × NAICS", "geography, county dynamics, pay"],
  ["Business Dynamics Statistics (BDS)", "Census Bureau", "1978–2023",
   "entry, exit, firm age and firm size", "dynamism, aging, exit margins"],
  ["Economic Census", "Census Bureau", "2012 / 2017 / 2022",
   "receipts, payroll, employment", "value dimension, validation"],
  ["Occupational Employment & Wage Statistics (OEWS)", "Bureau of Labor Statistics",
   "2003–2024", "hourly wage percentiles by occupation and state", "worker-level dispersion"],
];

const FILES = ["overview", "dynamism", "oews", "states", "stylized",
               "transitions", "implications"];

// Fill in when the code is published on GitHub, e.g.
// "https://github.com/<user>/us-specialty-trades"
const REPO_URL = "";
const PAPER_NOTE = "Companion to the research manuscript \"Firm Size, Market " +
  "Concentration, and Structural Change in the United States Specialty Trade " +
  "Contracting Industries, 1998-2023\" (under review).";

export function render() {
  document.getElementById("mSources").innerHTML = `
    <table class="data-table">
      <thead><tr><th>Source</th><th>Agency</th><th>Coverage</th><th>Content</th><th>Used for</th></tr></thead>
      <tbody>${SOURCES.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;

  document.getElementById("mDownloads").innerHTML = FILES
    .map((f) => `<a class="pill" href="data/${f}.json" download>${f}.json</a>`)
    .join(" ");

  const links = [`<p class="card-sub" style="margin-bottom:10px">${PAPER_NOTE}</p>`];
  if (REPO_URL) {
    links.push(`<a class="pill" href="${REPO_URL}" target="_blank" rel="noopener">Code on GitHub</a>`);
  } else {
    links.push(`<p class="foot-note" style="margin-top:4px">The full reproduction
      pipeline (Census/BLS downloaders through every figure and table) will be
      linked here when the repository is published.</p>`);
  }
  document.getElementById("mLinks").innerHTML = links.join("");
}

export function init() {}

// App bootstrap: theme, tab routing, data load, lazy view rendering.

import { loadAll } from "./data.js";
import * as overview from "./views/overview.js";
import * as wage from "./views/wage.js";
import * as survival from "./views/survival.js";
import * as states from "./views/states.js";
import * as outlook from "./views/outlook.js";
import * as lab from "./views/lab.js";
import * as methods from "./views/methods.js";

const VIEWS = { overview, wage, survival, states, outlook, lab, methods };
const inited = new Set();
const rendered = new Set();
let current = "overview";

// ---- tabs --------------------------------------------------------------
function initTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => show(btn.dataset.view));
  });
}

function show(name, force = false) {
  current = name;
  document.querySelectorAll(".tab").forEach((b) => {
    const on = b.dataset.view === name;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", on);
  });
  document.querySelectorAll(".view").forEach((v) => {
    v.hidden = v.id !== `view-${name}`;
  });
  if (!inited.has(name) && VIEWS[name].init) {
    VIEWS[name].init();
    inited.add(name);
  }
  if (force || !rendered.has(name)) {
    VIEWS[name].render();
    rendered.add(name);
  }
}

// ---- boot ----------------------------------------------------------------
async function boot() {
  initTabs();
  try {
    await loadAll();
    document.getElementById("loading").remove();
    show("overview", true);
  } catch (err) {
    document.getElementById("loading").textContent =
      "Could not load data files. If you opened index.html directly from disk, " +
      "serve the folder instead (for example: python -m http.server) - " +
      "browsers block fetch() on file:// pages. " + err.message;
  }
}

boot();

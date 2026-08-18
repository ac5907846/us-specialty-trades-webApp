// Central configuration: names, labels, and palette roles.
// Colors are read from CSS custom properties at chart-build time so the
// same code renders correctly in light and dark mode.

export const OCCS = {
  "47-2111": "Electricians",
  "47-2152": "Plumbers, pipefitters & steamfitters",
  "49-9021": "HVAC mechanics & installers",
};

export const TRADES = {
  electrical: "Electrical",
  plumbing_hvac: "Plumbing/HVAC",
};

export const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Resolve the live palette (call inside chart builders, not at module load,
// so a theme toggle picks up fresh values on re-render).
export function palette() {
  return {
    cobalt: cssVar("--cobalt"),
    green: cssVar("--green"),
    amber: cssVar("--amber"),
    rose: cssVar("--rose"),
    cobaltSoft: cssVar("--cobalt-soft"),
    greenSoft: cssVar("--green-soft"),
    amberSoft: cssVar("--amber-soft"),
    roseSoft: cssVar("--rose-soft"),
    text1: cssVar("--text-1"),
    text2: cssVar("--text-2"),
    text3: cssVar("--text-3"),
    grid: cssVar("--grid"),
    surface: cssVar("--surface-1"),
  };
}

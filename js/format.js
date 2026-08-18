// Number formatting helpers shared by every view.

export const fmtInt = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const fmtUsd = (v) =>
  "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const fmtUsd2 = (v) =>
  "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtPct = (v, d = 1) => `${Number(v).toFixed(d)}%`;

export const fmtSigned = (v, d = 1) =>
  `${v >= 0 ? "+" : ""}${Number(v).toFixed(d)}`;

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], r = n % 100;
  return n + (s[(r - 20) % 10] || s[r] || s[0]);
}

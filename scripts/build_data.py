"""Regenerate the web app's /data JSONs from the research pipeline outputs.

Run from inside 06_Web App after the pipeline (run_all.py) has produced
fresh processed files:

    py -3.12 scripts/build_data.py
"""
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent                     # the project folder
P = ROOT / "01_data" / "03_processed"
A = ROOT / "02_analysis"                      # per-module results live here
OUT = HERE.parent / "data"
OUT.mkdir(exist_ok=True)

FIPS = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
 "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
 "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
 "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
 "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
 "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
 "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
 "55":"WI","56":"WY"}


def dump(name, obj):
    f = OUT / f"{name}.json"
    f.write_text(json.dumps(obj, separators=(",", ":")))
    print(f"  {name}.json  {f.stat().st_size / 1024:.0f} KB")


def build_overview():
    tr = pd.read_csv(P / "trade_size_trends.csv")
    pay = pd.read_csv(A / "11_pay" / "results" / "pay_trends.csv")
    conc = pd.read_csv(P / "cbp_concentration.csv")
    alpha = pd.read_csv(A / "04_tail" / "results" / "alpha_by_year.csv")
    ov = {}
    for t in ("electrical", "plumbing_hvac"):
        d = tr[tr.trade == t].sort_values("year")
        p = pay[pay.trade == t].sort_values("year")
        c = conc[(conc.trade == t) & (conc.basis == "harmonised")].sort_values("year")
        a = alpha[alpha.trade == t].sort_values("year")
        ov[t] = {"years": d.year.astype(int).tolist(),
                 "firms": d.firms.round(0).tolist(),
                 "emp": d.emp.round(0).tolist(),
                 "sh500": (d.sh_500p * 100).round(2).tolist(),
                 "shLt20": (d.sh_lt20 * 100).round(2).tolist(),
                 "payYears": p.year.astype(int).tolist(),
                 "pay": p.pay_national.round(0).tolist(),
                 "premium": (p.premium_wtd * 100).round(2).tolist(),
                 "p9010": p.p90_p10.round(3).tolist(),
                 "concYears": c.year.astype(int).tolist(),
                 "top20": (c.top20 * 100).round(2).tolist(),
                 "alphaYears": a.year.astype(int).tolist(),
                 "alpha": a.alpha_mle.round(3).tolist(),
                 "alphaLo": a.ci_lo.round(3).tolist(),
                 "alphaHi": a.ci_hi.round(3).tolist()}
    dump("overview", ov)


def build_dynamism():
    spec = pd.read_parquet(P / "bds_specialty_4digit.parquet")
    bench = pd.read_parquet(P / "bds_benchmarks.parquet")
    b = spec[spec.vcnaics4.astype(str) == "2382"].sort_values("year")
    econ = bench[bench.level == "economy"].sort_values("year")
    fa = pd.read_parquet(P / "bds_specialty_fa.parquet")
    g = fa[fa.vcnaics4.astype(str) == "2382"].copy()
    g["firms"] = pd.to_numeric(g.firms, errors="coerce")
    g["fage"] = g.fage.replace("l) Left Censored", "k) 26+")
    young = ["a) 0", "b) 1", "c) 2", "d) 3", "e) 4", "f) 5"]
    mature = ["i) 16 to 20", "j) 21 to 25", "k) 26+"]
    tot = g.groupby("year").firms.sum()
    ys = g[g.fage.isin(young)].groupby("year").firms.sum() / tot * 100
    ms = g[g.fage.isin(mature)].groupby("year").firms.sum() / tot * 100
    fz = pd.read_parquet(P / "bds_specialty_fz.parquet")
    z = fz[fz.vcnaics4.astype(str) == "2382"].copy()
    for c in ("firms", "firmdeath_firms"):
        z[c] = pd.to_numeric(z[c], errors="coerce")
    grp = {"a) 1 to 4": 0, "b) 5 to 9": 0, "c) 10 to 19": 0,
           "d) 20 to 99": 1, "e) 100 to 499": 1}
    z["g"] = z.fsize.map(grp).fillna(2)
    zz = z.groupby(["year", "g"])[["firms", "firmdeath_firms"]].sum().reset_index()
    zz["rate"] = 100 * zz.firmdeath_firms / zz.firms
    death = {}
    for gg, nm in ((0, "small"), (1, "mid"), (2, "large")):
        s = zz[zz.g == gg].sort_values("year")
        death[nm] = {"years": s.year.astype(int).tolist(),
                     "rate": s.rate.round(3).tolist(),
                     "deaths": s.firmdeath_firms.round(0).tolist(),
                     "firms": s.firms.round(0).tolist()}
    dump("dynamism", {"years": b.year.astype(int).tolist(),
                      "entry": b.estabs_entry_rate.round(2).tolist(),
                      "exit": b.estabs_exit_rate.round(2).tolist(),
                      "econYears": econ.year.astype(int).tolist(),
                      "econEntry": econ.estabs_entry_rate.round(2).tolist(),
                      "ageYears": ys.index.astype(int).tolist(),
                      "young": ys.round(2).tolist(),
                      "mature": ms.round(2).tolist(),
                      "death": death})


def build_oews():
    oe = pd.read_parquet(P / "oews_percentiles.parquet")
    st = oe[oe.scope == "state"].copy()
    st["usps"] = st.geo.str.upper().str[:2]
    st = st[st.occ.isin(["47-2111", "47-2152", "49-9021"])]
    recs = {}
    for occ, go in st.groupby("occ"):
        recs[occ] = {}
        for usps, gs in go.groupby("usps"):
            gs = gs.sort_values("year")
            recs[occ][usps] = {"years": gs.year.astype(int).tolist(),
                "p10": gs.p10.round(2).tolist(), "p25": gs.p25.round(2).tolist(),
                "p50": gs.p50.round(2).tolist(), "p75": gs.p75.round(2).tolist(),
                "p90": gs.p90.round(2).tolist(),
                "emp": gs.emp.fillna(0).round(0).tolist()}
    nat = oe[(oe.scope == "national")
             & oe.occ.isin(["47-2111", "47-2152", "49-9021", "00-0000"])]
    natrec = {}
    for occ, gn in nat.groupby("occ"):
        gn = gn.sort_values("year")
        natrec[occ] = {"years": gn.year.astype(int).tolist(),
                       "p50": gn.p50.round(2).tolist(),
                       "p9010": gn.p90_p10.round(3).tolist()}
    dump("oews", {"state": recs, "national": natrec})


def build_states():
    pp = pd.read_parquet(P / "cbp_pay_panel.parquet")
    pp["state"] = pp.fips.str[:2]
    out = {}
    for (t, sfp), gg in pp.groupby(["trade", "state"]):
        us = FIPS.get(sfp)
        if not us:
            continue
        rows = []
        for yr, d in gg.groupby("year"):
            rows.append((int(yr), float(d.est.sum()), float(d.emp.sum()),
                         float(d.ap.sum() * 1000 / d.emp.sum()),
                         float(100 * np.average(d.premium, weights=d.emp)),
                         float(100 * np.average(d.sh_lg.fillna(0), weights=d.emp))))
        rows.sort()
        out.setdefault(t, {})[us] = {
            "years": [r[0] for r in rows],
            "est": [round(r[1]) for r in rows],
            "emp": [round(r[2]) for r in rows],
            "pay": [round(r[3]) for r in rows],
            "premium": [round(r[4], 2) for r in rows],
            "shlg": [round(r[5], 2) for r in rows]}
    dump("states", out)


def build_stylized():
    sf = pd.read_csv(A / "14_summary" / "results" / "stylized_facts.csv").round(3)
    sf = sf.astype(object).where(pd.notna(sf), None)   # NaN is not valid JSON
    dump("stylized", sf.to_dict(orient="records"))




def build_transitions():
    """Harmonised Markov matrices (3+ floor in every year), from
    02_analysis/07_transitions/results/transition_matrices_harmonised.csv."""
    f = ROOT / "02_analysis" / "07_transitions" / "results" / \
        "transition_matrices_harmonised.csv"
    if not f.exists():
        print("  transitions: harmonised matrices not found, skipped")
        return
    long = pd.read_csv(f)
    cats = ["<3", "3-4", "5-19", "20-99", "100+"]
    mobf = f.parent / "mobility_harmonised.csv"
    mob = pd.read_csv(mobf) if mobf.exists() else None
    out = {"cats": cats, "eras": ["1998-2007", "2007-2016", "2017-2023"],
           "trades": {}}
    for t in ("electrical", "plumbing_hvac"):
        out["trades"][t] = {}
        for era in out["eras"]:
            m = long[(long.trade == t) & (long.era == era)]
            M = m.set_index("from")[cats].reindex(cats)
            n = int(mob[(mob.trade == t) & (mob.era == era)].counties.iloc[0]) \
                if mob is not None else 0
            out["trades"][t][era] = {"M": M.round(4).values.tolist(),
                                     "counties": n}
    dump("transitions", out)


def build_implications():
    ls = pd.read_csv(ROOT / "02_analysis" / "12_location_scale" / "results"
                     / "location_scale.csv")
    ov = json.loads((OUT / "overview.json").read_text())
    dyn = json.loads((OUT / "dynamism.json").read_text())
    ec = pd.read_csv(ROOT / "02_analysis" / "02_panels" / "results"
                     / "tab_economic_census.csv")
    imp = {"locscale": {}, "sh500": {}, "death": {}, "receipts": {},
           "aging": {"firms26_2005": 22714, "firms26_2023": 39999,
                     "share16_2023": 41.1, "share16_1992": 24.9},
           "firstWave": {"peakYear": 2001, "peakShare": 18.3,
                         "troughYear": 2004, "troughShare": 11.1}}
    for t in ("electrical", "plumbing_hvac"):
        r = ls[(ls.trade == t) & (ls.era == "1998-2016")].iloc[0]
        imp["locscale"][t] = {
            "bMu": round(float(r.beta_mean), 4),
            "bSig": round(float(r.beta_logsd), 3),
            "sigLo": round(float(r.sd_ci_lo), 3),
            "sigHi": round(float(r.sd_ci_hi), 3),
            "sigma": round(float(r.sigma_baseline), 4)}
        ys, sh = ov[t]["years"], ov[t]["sh500"]
        w = [(y, s) for y, s in zip(ys, sh) if y >= 2012]
        slope = np.polyfit([p[0] for p in w], [p[1] for p in w], 1)[0]
        imp["sh500"][t] = {"lastYear": int(ys[-1]), "last": float(sh[-1]),
                           "trendPerYear": round(float(slope), 3)}
        e = ec[ec.trade == t]
        imp["receipts"][t] = {
            "y17": {"receipts": float(e[e.year == 2017].receipts_musd.iloc[0]),
                    "perFirm": round(float(
                        e[e.year == 2017].receipts_per_firm_musd.iloc[0]), 2)},
            "y22": {"receipts": float(e[e.year == 2022].receipts_musd.iloc[0]),
                    "perFirm": round(float(
                        e[e.year == 2022].receipts_per_firm_musd.iloc[0]), 2)}}
    d = dyn["death"]
    for nm in ("small", "mid", "large"):
        yrs, rates = d[nm]["years"], d[nm]["rate"]
        idx = [i for i, y in enumerate(yrs) if y >= 2017]
        imp["death"][nm] = {
            "rate2017_23": round(float(np.mean([rates[i] for i in idx])), 2),
            "firms2023": int(d[nm]["firms"][-1]),
            "rate2023": float(rates[-1])}
    dump("implications", imp)

if __name__ == "__main__":
    print("building web app data from", ROOT)
    build_overview()
    build_dynamism()
    build_oews()
    build_states()
    build_stylized()
    build_transitions()
    build_implications()
    print("done.")

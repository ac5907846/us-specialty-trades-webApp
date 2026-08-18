// Data access layer. All series are static JSON files generated from the
// research pipeline (see scripts/build_data.py) and served from /data.

const FILES = ["overview", "dynamism", "oews", "states", "stylized", "transitions", "implications"];
const cache = {};

export async function loadAll() {
  const results = await Promise.all(
    FILES.map(async (name) => {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`Failed to load data/${name}.json (${res.status})`);
      return [name, await res.json()];
    })
  );
  for (const [name, obj] of results) cache[name] = obj;
  return cache;
}

export const data = cache;

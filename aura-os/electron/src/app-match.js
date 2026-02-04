function normalize(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}
function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + (a[i - 1] !== b[j - 1]),
      );
    row = next;
  }
  return row[b.length];
}
function resolveApplication(query, apps) {
  const q = normalize(query);
  if (!q) throw new Error("Tell me which app to open.");
  const ranked = apps
    .map(({ name }) => {
      const n = normalize(name);
      const digits = q.match(/\d+/g)?.join("") || "";
      const nd = n.match(/\d+/g)?.join("") || "";
      let score =
        n === q
          ? 1
          : n.includes(q)
            ? 0.96
            : 1 - distance(q, n) / Math.max(q.length, n.length);
      if (digits && digits !== nd) score = 0;
      return { name, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 0.72)
    throw new Error(
      `No installed app matches “${query}”. Try its full name or “list apps”.`,
    );
  if (ranked[1] && best.score - ranked[1].score < 0.07)
    throw new Error(
      "Which app? " +
        ranked
          .filter((x) => best.score - x.score < 0.07)
          .slice(0, 4)
          .map((x) => x.name)
          .join(", "),
    );
  return best.name;
}
module.exports = { resolveApplication };

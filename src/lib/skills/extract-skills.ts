export type SkillLexiconEntry = { name: string; aliases: string[] };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createSkillMatcher(entries: SkillLexiconEntry[]): (text: string) => string[] {
  const canonicalByTerm = new Map<string, string>();
  // An entry's own name always beats another entry's alias, matching the Python loader.
  for (const entry of entries) {
    const key = entry.name.trim().toLowerCase();
    if (key) canonicalByTerm.set(key, entry.name);
  }
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      const key = alias.trim().toLowerCase();
      if (key && !canonicalByTerm.has(key)) canonicalByTerm.set(key, entry.name);
    }
  }

  if (canonicalByTerm.size === 0) return () => [];

  const alternation = [...canonicalByTerm.keys()]
    .sort((a, b) => b.length - a.length)
    .map((term) => escapeRegExp(term).replace(/\s+/g, "\\s+"))
    .join("|");
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}_+#])(?:${alternation})(?![\\p{L}\\p{N}_+#])`,
    "giu",
  );

  return (text: string): string[] => {
    if (!text) return [];
    const found = new Set<string>();
    for (const match of text.matchAll(pattern)) {
      const canonical = canonicalByTerm.get(match[0].toLowerCase().replace(/\s+/g, " "));
      if (canonical) found.add(canonical);
    }
    return [...found].sort();
  };
}

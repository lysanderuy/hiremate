export type SkillLexiconEntry = { name: string; aliases: string[] };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createSkillMatcher(entries: SkillLexiconEntry[]): (text: string) => string[] {
  const canonicalByTerm = new Map<string, string>();
  for (const entry of entries) {
    for (const term of [entry.name, ...entry.aliases]) {
      const key = term.trim().toLowerCase();
      if (key && !canonicalByTerm.has(key)) canonicalByTerm.set(key, entry.name);
    }
  }

  if (canonicalByTerm.size === 0) return () => [];

  const alternation = [...canonicalByTerm.keys()]
    .sort((a, b) => b.length - a.length)
    .map((term) => escapeRegExp(term).replace(/\s+/g, "\\s+"))
    .join("|");
  const pattern = new RegExp(`(?<![\\w+#])(?:${alternation})(?![\\w+#])`, "gi");

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

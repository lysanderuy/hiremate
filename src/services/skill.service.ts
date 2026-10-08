import "server-only";

import { and, asc, eq, ilike, inArray } from "drizzle-orm";

import { db } from "@/db";
import { skills } from "@/db/schema";
import { escapeLike } from "@/lib/escape-like";
import { createSkillMatcher } from "@/lib/skills/extract-skills";
import type {
  ListSkillsQuery,
  SkillResponse,
  SuggestSkillsInput,
} from "@/validators/skill.validator";

export type DbExecutor = Pick<typeof db, "select">;

export const skillService = {
  async listActive({ q, limit }: ListSkillsQuery): Promise<SkillResponse[]> {
    const search = q?.trim();
    const pattern = search ? `%${escapeLike(search)}%` : undefined;

    return db
      .select({ id: skills.id, name: skills.name })
      .from(skills)
      .where(and(eq(skills.isActive, true), pattern ? ilike(skills.name, pattern) : undefined))
      .orderBy(asc(skills.name))
      .limit(limit);
  },

  async suggest({ title, description }: SuggestSkillsInput): Promise<SkillResponse[]> {
    const lexicon = await db
      .select({ id: skills.id, name: skills.name, aliases: skills.aliases })
      .from(skills)
      .where(eq(skills.isActive, true));

    const matched = new Set(createSkillMatcher(lexicon)(`${title}\n${description}`));

    return lexicon
      .filter((skill) => matched.has(skill.name))
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getActiveByIds(ids: string[], executor: DbExecutor = db): Promise<SkillResponse[]> {
    if (ids.length === 0) return [];

    return executor
      .select({ id: skills.id, name: skills.name })
      .from(skills)
      .where(and(inArray(skills.id, ids), eq(skills.isActive, true)));
  },
};

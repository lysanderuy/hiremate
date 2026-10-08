"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { FieldLabel } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { useSkills } from "@/hooks/use-skills";
import { useSuggestSkills } from "@/hooks/use-suggest-skills";
import type { SkillResponse } from "@/validators/skill.validator";

type SkillPickerProps = {
  value: SkillResponse[];
  onChange: (skills: SkillResponse[]) => void;
  title: string;
  description: string;
  max?: number;
};

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring";

const chipButtonClassName =
  "inline-flex min-h-8 items-center gap-1 rounded-full border border-tint-border bg-white px-3 text-sm text-navy outline-none transition-colors hover:bg-tint focus-visible:ring-3 focus-visible:ring-ring";

export function SkillPicker({ value, onChange, title, description, max = 30 }: SkillPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 250);
  const debouncedTitle = useDebounce(title.trim(), 800);
  const debouncedDescription = useDebounce(description.trim(), 800);

  const skills = useSkills(debouncedQuery);
  const canSuggest = debouncedTitle.length >= 3 && debouncedDescription.length >= 20;
  const suggestions = useSuggestSkills(
    { title: debouncedTitle, description: debouncedDescription },
    canSuggest,
  );

  const selectedIds = new Set(value.map((skill) => skill.id));
  const atLimit = value.length >= max;
  const matches = (skills.data ?? []).filter((skill) => !selectedIds.has(skill.id));
  const suggested = canSuggest
    ? (suggestions.data ?? []).filter((skill) => !selectedIds.has(skill.id))
    : [];

  function add(toAdd: SkillResponse[]) {
    const room = max - value.length;
    if (room <= 0) return;
    onChange([...value, ...toAdd.slice(0, room)]);
  }

  function remove(id: string) {
    onChange(value.filter((skill) => skill.id !== id));
  }

  return (
    <div className="space-y-3">
      <FieldLabel htmlFor="skill-search" optional>
        Skills
      </FieldLabel>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Selected skills">
          {value.map((skill) => (
            <li
              key={skill.id}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-tint pr-1 pl-3 text-sm text-primary"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => remove(skill.id)}
                aria-label={`Remove ${skill.name}`}
                className="flex size-6 items-center justify-center rounded-full outline-none hover:bg-white focus-visible:ring-3 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggested.length > 0 && !atLimit && (
        <div className="space-y-2 rounded-lg border border-tint-border bg-tint/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-navy">Found in your text</p>
            <Button type="button" variant="outline" size="sm" onClick={() => add(suggested)}>
              Add all
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {suggested.map((skill) => (
              <li key={skill.id}>
                <button
                  type="button"
                  onClick={() => add([skill])}
                  aria-label={`Add ${skill.name}`}
                  className={chipButtonClassName}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {skill.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <input
          id="skill-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={atLimit}
          maxLength={40}
          autoComplete="off"
          placeholder="Search for a skill"
          className={inputClassName}
        />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {atLimit
            ? `You can add up to ${max} skills.`
            : `${value.length} of ${max} skills selected.`}
        </p>
        {!atLimit && (
          <>
            {skills.isError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {skills.error.message}
              </p>
            )}
            {skills.isPending && <p className="text-sm text-muted-foreground">Loading skills...</p>}
            {skills.data && matches.length === 0 && (
              <p className="text-sm text-muted-foreground">No matching skills.</p>
            )}
            {matches.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Matching skills">
                {matches.map((skill) => (
                  <li key={skill.id}>
                    <button
                      type="button"
                      onClick={() => add([skill])}
                      aria-label={`Add ${skill.name}`}
                      className={chipButtonClassName}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      {skill.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

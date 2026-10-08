"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FIELD_CLASS } from "@/components/shared/field-label";
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

const chipButtonClassName =
  "inline-flex h-7 items-center gap-1 rounded-full border border-line bg-white px-3 text-chip font-medium text-ink outline-none transition-colors hover:border-primary-soft-line hover:bg-primary-soft focus-visible:shadow-focus";

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
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="font-display text-base font-semibold text-ink">Skills</h2>
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Found from your title and description. Remove any that do not belong, or add more from the
        list.
      </p>

      <div className="space-y-3">
        {value.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Selected skills">
            {value.map((skill) => (
              <li
                key={skill.id}
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary-soft pr-1.5 pl-3 text-chip font-medium text-primary"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => remove(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                  className="flex size-5 items-center justify-center rounded-full outline-none hover:bg-primary/15 focus-visible:shadow-focus"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {suggested.length > 0 && !atLimit && (
          <div className="space-y-2 rounded-md border border-primary-soft-line bg-primary-soft/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">Found in your text</p>
              <Button type="button" variant="outline" size="xs" onClick={() => add(suggested)}>
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
          <label htmlFor="skill-search" className="sr-only">
            Search for a skill
          </label>
          <input
            id="skill-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={atLimit}
            maxLength={40}
            autoComplete="off"
            placeholder="Search for a skill"
            className={FIELD_CLASS}
          />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {atLimit
              ? `You can add up to ${max} skills.`
              : `${value.length} of ${max} skills selected.`}
          </p>
          {!atLimit && (
            <>
              {skills.isError && (
                <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
                  {skills.error.message}
                </p>
              )}
              {skills.isPending && <p className="text-muted-foreground">Loading skills...</p>}
              {skills.data && matches.length === 0 && (
                <p className="text-muted-foreground">No matching skills.</p>
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
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { RESUME_SOURCE_LABELS } from "@/lib/resume/client-file";
import type { ResumeResponse } from "@/validators/resume.validator";

import { SkillChips } from "./skill-chips";

export function SkillsFoundCard({ resume }: { resume: ResumeResponse | null | undefined }) {
  let body: React.ReactNode;
  if (!resume) {
    body = <p>No skills yet. They show up once you add a resume.</p>;
  } else if (resume.state === "failed") {
    body = <p>Skills show up once your resume is processed.</p>;
  } else {
    body = (
      <>
        <p className="mb-3">
          {resume.skills.length} found. Saved {formatDate(resume.updatedAt)} &middot;{" "}
          {RESUME_SOURCE_LABELS[resume.source]}.
        </p>
        {resume.skills.length > 0 ? (
          <SkillChips skills={resume.skills} />
        ) : (
          <span className="text-muted-foreground">None found</span>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Skills come from our skills list. You cannot edit them yet.
        </p>
      </>
    );
  }

  return (
    <Card className="gap-0 p-5">
      <h2 className="mb-3 text-base font-semibold">Skills found</h2>
      <div aria-live="polite">{body}</div>
    </Card>
  );
}

export function WhatWeDoCard() {
  return (
    <Card className="gap-0 p-5">
      <h2 className="mb-3 text-base font-semibold">What we do with it</h2>
      <ol className="grid list-decimal gap-2 pl-5">
        <li>We read the text and find skills from our list.</li>
        <li>We compare it with each listing to give you a score.</li>
        <li>Only recruiters you apply to can read it.</li>
      </ol>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReprocessResume, useResume } from "@/hooks/use-resume";

import { ResumeCallout } from "./resume-callout";
import { ResumeDropzone } from "./resume-dropzone";
import { SkillsFoundCard, WhatWeDoCard } from "./resume-side-cards";

export function ResumeEditor() {
  const { data, isPending, error } = useResume();
  const reprocess = useReprocessResume();

  if (isPending) return <p className="text-muted-foreground">Loading...</p>;
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error.message}
      </p>
    );
  }

  return (
    <>
      {data?.state === "processing" && (
        <ResumeCallout>Preparing your resume. This takes a few seconds.</ResumeCallout>
      )}
      {data?.state === "failed" && (
        <ResumeCallout
          tone="error"
          action={
            <Button size="sm" onClick={() => reprocess.mutate()} disabled={reprocess.isPending}>
              {reprocess.isPending ? "Retrying..." : "Retry"}
            </Button>
          }
        >
          We could not process your resume. Try again.
        </ResumeCallout>
      )}
      {reprocess.error && (
        <p role="alert" className="mb-6 rounded-md bg-error-soft px-4 py-3 text-error">
          {reprocess.error.message}
        </p>
      )}

      <div className="grid items-start gap-6 min-[1101px]:grid-cols-[1.6fr_1fr]">
        <Card className="gap-4 p-5 sm:p-6">
          <ResumeDropzone />
          <p className="text-xs text-muted-foreground">
            Your existing applications keep the resume you sent with them.
          </p>
        </Card>

        <div className="grid gap-4">
          <SkillsFoundCard resume={data} />
          <WhatWeDoCard />
        </div>
      </div>
    </>
  );
}

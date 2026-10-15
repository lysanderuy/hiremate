"use client";

import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReprocessResume, useResume } from "@/hooks/use-resume";
import { useUploadResumePdf } from "@/hooks/use-upload-resume-pdf";
import { checkPdfFile } from "@/lib/resume/client-file";

import { ResumeCallout } from "./resume-callout";
import { ResumeDropzone } from "./resume-dropzone";
import { SkillsFoundCard, WhatWeDoCard } from "./resume-side-cards";

export function ResumeEditor() {
  const { data, isPending, error } = useResume();
  const reprocess = useReprocessResume();
  const upload = useUploadResumePdf();
  const [fileError, setFileError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (isPending) return <p className="text-muted-foreground">Loading...</p>;
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error.message}
      </p>
    );
  }

  function handleFile(file: File) {
    setSaved(false);
    const problem = checkPdfFile(file);
    setFileError(problem);
    if (problem) return;
    upload.mutate(file, { onSuccess: () => setSaved(true) });
  }

  return (
    <>
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
          <ResumeDropzone
            uploading={upload.isPending}
            error={fileError ?? upload.error?.message ?? null}
            saved={saved}
            onFile={handleFile}
          />
          <p className="text-xs text-muted-foreground">
            {data
              ? "Uploading a new PDF replaces your current resume. Your existing applications keep the resume you sent with them."
              : "We keep your PDF so you and the recruiters you apply to can open it. We also read it for skills."}
          </p>
          {data && (
            <a
              href="/api/resumes/me/file"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Open resume (PDF)
            </a>
          )}
        </Card>

        <div className="grid gap-4">
          <SkillsFoundCard resume={data} />
          <WhatWeDoCard />
        </div>
      </div>
    </>
  );
}

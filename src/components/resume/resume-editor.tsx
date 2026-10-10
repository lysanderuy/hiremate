"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FIELD_CLASS } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReprocessResume, useResume, useSaveResume } from "@/hooks/use-resume";
import {
  PDF_COMING_SOON_MESSAGE,
  checkResumeFile,
  getResumeTextError,
  isResumeTextValid,
  parseResumeReturn,
} from "@/lib/resume/client-file";
import { cn } from "@/lib/utils";
import { useFormGuardStore } from "@/stores/form-guard.store";
import { MAX_RESUME_LENGTH, type ResumeResponse } from "@/validators/resume.validator";

import { ResumeCallout } from "./resume-callout";
import { ResumeDropzone } from "./resume-dropzone";
import { SkillsFoundCard, WhatWeDoCard } from "./resume-side-cards";

type Method = "paste" | "file";

const TABS: { method: Method; label: string }[] = [
  { method: "paste", label: "Paste text" },
  { method: "file", label: "Upload file" },
];

export function ResumeEditor() {
  const { data, isPending, error } = useResume();

  if (isPending) return <p className="text-muted-foreground">Loading...</p>;
  if (error) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error.message}
      </p>
    );
  }

  return <ResumeWorkspace resume={data} />;
}

function ResumeWorkspace({ resume }: { resume: ResumeResponse | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useResume();
  const saveResume = useSaveResume();
  const reprocess = useReprocessResume();
  const setGuardDirty = useFormGuardStore((state) => state.setDirty);

  const [method, setMethod] = useState<Method>("paste");
  const [text, setText] = useState(resume?.text ?? "");
  const [baseline, setBaseline] = useState(resume?.text ?? "");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const state = resume?.state ?? null;
  const busy = state === "processing";
  const reviewing = method === "file" && fileName !== "";
  const showTextBox = method === "paste" || reviewing;
  const textError = getResumeTextError(text);
  const canSave =
    isResumeTextValid(text) && !saveResume.isPending && !busy && (method === "paste" || reviewing);
  const dirty = text !== baseline || fileName !== "";

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => void refetch(), 2000);
    return () => window.clearInterval(timer);
  }, [busy, refetch]);

  useEffect(() => {
    setGuardDirty(dirty);
  }, [dirty, setGuardDirty]);

  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => () => setGuardDirty(false), [setGuardDirty]);

  function handleFile(file: File) {
    setSaved(false);
    setFileName("");
    const check = checkResumeFile(file);
    if (!check.ok) {
      setFileError(check.error);
      return;
    }
    if (check.source === "pdf") {
      setFileError(PDF_COMING_SOON_MESSAGE);
      return;
    }
    setFileError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      setFileName(file.name);
    };
    reader.onerror = () => setFileError("We could not read this file. Paste your text instead.");
    reader.readAsText(file);
  }

  function handleSave() {
    if (!canSave) return;
    setSaved(false);
    saveResume.mutate(
      { text: text.trim(), source: reviewing ? "text_file" : "pasted" },
      {
        onSuccess: (result) => {
          setBaseline(result.text);
          setText(result.text);
          setFileName("");
          setGuardDirty(false);
          setSaved(true);
          const destination = parseResumeReturn(searchParams.get("return"));
          if (destination) router.push(`/dashboard/applicant/${destination}`);
        },
      },
    );
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setMethod((current) => (current === "paste" ? "file" : "paste"));
    document.getElementById(method === "paste" ? "resume-tab-file" : "resume-tab-paste")?.focus();
  }

  return (
    <>
      {busy && <ResumeCallout>Preparing your resume. This takes a few seconds.</ResumeCallout>}
      {state === "failed" && (
        <ResumeCallout
          tone="error"
          action={
            <Button size="sm" onClick={() => reprocess.mutate()} disabled={reprocess.isPending}>
              {reprocess.isPending ? "Retrying..." : "Retry"}
            </Button>
          }
        >
          We could not process your resume. Try saving again.
        </ResumeCallout>
      )}
      {reprocess.error && (
        <p role="alert" className="mb-6 rounded-md bg-error-soft px-4 py-3 text-error">
          {reprocess.error.message}
        </p>
      )}

      <div className="grid items-start gap-6 min-[1101px]:grid-cols-[1.6fr_1fr]">
        <Card className="gap-5 p-5 sm:p-6">
          <div
            role="tablist"
            aria-label="How to add your resume"
            className="inline-flex w-fit gap-1 rounded-lg bg-page p-1"
          >
            {TABS.map((tab) => {
              const selected = method === tab.method;
              return (
                <button
                  key={tab.method}
                  id={`resume-tab-${tab.method}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="resume-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setMethod(tab.method)}
                  onKeyDown={handleTabKeyDown}
                  className={cn(
                    "h-8 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selected
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            id="resume-panel"
            role="tabpanel"
            aria-labelledby={`resume-tab-${method}`}
            className="grid gap-4"
          >
            {method === "file" && (
              <ResumeDropzone
                disabled={busy}
                fileName={fileName}
                error={fileError}
                onFile={handleFile}
              />
            )}
            {showTextBox && (
              <div className="grid gap-1.5">
                <label htmlFor="resume-text" className="text-sm font-medium text-ink">
                  {reviewing
                    ? "Review the text we read from your file. Edit it if needed."
                    : "Your resume text"}
                </label>
                <textarea
                  id="resume-text"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setSaved(false);
                  }}
                  disabled={busy}
                  placeholder="Paste your resume here. Plain text works best."
                  aria-invalid={Boolean(textError)}
                  aria-describedby="resume-text-meta"
                  className={cn(FIELD_CLASS, "h-auto min-h-72 py-3 leading-relaxed max-sm:h-auto")}
                />
                <div
                  id="resume-text-meta"
                  className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs"
                >
                  <span role="alert" className="text-error">
                    {textError}
                  </span>
                  <span className="text-muted-foreground">
                    {text.length.toLocaleString("en-US")} of{" "}
                    {MAX_RESUME_LENGTH.toLocaleString("en-US")} characters. Minimum 200.
                  </span>
                </div>
              </div>
            )}
          </div>

          {saveResume.error && (
            <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
              {saveResume.error.message}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {resume
                ? "Your existing applications keep the resume you sent with them."
                : "Nothing is saved until you press Save resume."}
            </span>
            <div className="flex items-center gap-3">
              <p role="status" className="text-sm text-ink">
                {saved ? "Resume saved." : ""}
              </p>
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                {saveResume.isPending ? "Saving..." : "Save resume"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <SkillsFoundCard resume={resume} />
          <WhatWeDoCard />
        </div>
      </div>
    </>
  );
}

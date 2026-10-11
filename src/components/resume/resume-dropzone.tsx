"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ResumeDropzoneProps = {
  uploading: boolean;
  error: string | null;
  saved: boolean;
  onFile: (file: File) => void;
};

export function ResumeDropzone({ uploading, error, saved, onFile }: ResumeDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !uploading) onFile(file);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(file);
  }

  return (
    <div className="grid gap-3">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "grid cursor-pointer justify-items-center gap-2 rounded-xl border-2 border-dashed border-line-dashed bg-page px-5 py-8 text-center transition-colors hover:border-primary hover:bg-primary-soft focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-primary",
          dragging && "border-primary bg-primary-soft",
          uploading && "cursor-not-allowed opacity-60 hover:border-line-dashed hover:bg-page",
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <b className="text-ink">Upload a PDF</b>
        <span>Drag a text-based PDF here, or click to choose one. PDFs up to 4 MB.</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          aria-label="Resume PDF"
          disabled={uploading}
          onChange={handleChange}
          className="sr-only"
        />
      </label>
      <div aria-live="polite">
        {uploading && <p className="text-sm text-muted-foreground">Reading your PDF...</p>}
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
      <p role="status" className="text-sm text-ink">
        {saved ? "Resume saved." : ""}
      </p>
    </div>
  );
}

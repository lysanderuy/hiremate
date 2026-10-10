"use client";

import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResumeDropzoneProps = {
  disabled: boolean;
  fileName: string;
  error: string | null;
  onFile: (file: File) => void;
};

export function ResumeDropzone({ disabled, fileName, error, onFile }: ResumeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(file);
  }

  return (
    <div className="grid gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "grid justify-items-center gap-2 rounded-xl border-2 border-dashed border-line-dashed bg-page px-5 py-8 text-center transition-colors",
          dragging && "border-primary bg-primary-soft",
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <b className="text-ink">Upload a .txt or text-based PDF</b>
        <p>Drag a file here, or choose one. Text files up to 200 KB, PDFs up to 4 MB.</p>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,text/plain,application/pdf"
          tabIndex={-1}
          aria-label="Resume file"
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
      {fileName && (
        <div>
          <span className="inline-flex h-7 max-w-full items-center gap-2 rounded-full bg-primary-soft px-3 text-chip font-medium break-all text-primary">
            <FileText className="size-3.5 shrink-0" aria-hidden="true" />
            {fileName}
          </span>
        </div>
      )}
    </div>
  );
}

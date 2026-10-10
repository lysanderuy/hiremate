import { Upload } from "lucide-react";

export function ResumeDropzone() {
  return (
    <div
      aria-disabled="true"
      className="grid justify-items-center gap-2 rounded-xl border-2 border-dashed border-line-dashed bg-page px-5 py-8 text-center opacity-70"
    >
      <span className="grid size-10 place-items-center rounded-full bg-weak-soft text-weak">
        <Upload className="size-5" aria-hidden="true" />
      </span>
      <b className="text-ink">Upload a PDF</b>
      <p>PDF upload is coming soon. PDFs up to 4 MB.</p>
    </div>
  );
}

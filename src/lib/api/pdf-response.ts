export function sanitizePdfFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/[\\/]/g, "")
    .replace(/["\u0000-\u001f\u007f]/g, "")
    .replace(/[^\x20-\x7e]/g, "_")
    .trim();
  const base = cleaned.replace(/\.pdf$/i, "");
  return `${base || "resume"}.pdf`;
}

export function pdfResponse(data: Buffer, fileName: string): Response {
  const fallback = sanitizePdfFileName(fileName);
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

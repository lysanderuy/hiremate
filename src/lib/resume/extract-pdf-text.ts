import "server-only";

export async function extractPdfText(): Promise<string> {
  throw new Error("PDF upload is not supported yet");
}

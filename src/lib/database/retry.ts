const TRANSIENT_DATABASE_ERROR_CODES = new Set([
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

const RETRY_DELAY_MS = 100;

function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;

  const code = (error as NodeJS.ErrnoException).code;
  if (typeof code === "string") return code;

  return getErrorCode(error.cause);
}

export async function retryDatabaseRead<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!TRANSIENT_DATABASE_ERROR_CODES.has(getErrorCode(error) ?? "")) throw error;

    await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return operation();
  }
}

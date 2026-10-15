import "server-only";

import { isNull, lt, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { env } from "@/lib/env";
import { normalizeMatcherUrl } from "@/lib/matching/matcher-url";
import {
  embedResponseSchema,
  type EmbedKind,
  type EmbedRequest,
} from "@/validators/matcher.validator";

const TIMEOUT_MS = 8_000;

export class MatcherUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "MatcherUnavailableError";
  }
}

type MatcherConfig = { baseUrl: string; apiKey: string };

let cachedConfig: MatcherConfig | null = null;

function getConfig(): MatcherConfig {
  if (cachedConfig) return cachedConfig;

  let url: string | undefined;
  let apiKey: string | undefined;
  try {
    url = env.MATCHER_URL;
    apiKey = env.MATCHER_API_KEY;
  } catch {
    throw new MatcherUnavailableError("Matcher configuration is invalid.");
  }
  if (!url || !apiKey) throw new MatcherUnavailableError("Matcher is not configured.");

  const baseUrl = normalizeMatcherUrl(url, process.env.NODE_ENV === "production");
  if (!baseUrl) throw new MatcherUnavailableError("MATCHER_URL is not an allowed address.");

  cachedConfig = { baseUrl, apiKey };
  return cachedConfig;
}

export const PREPARE_COOLDOWN_MESSAGE = "Please wait a moment before retrying.";

export function prepareCooldownElapsed(column: PgColumn): SQL {
  return or(isNull(column), lt(column, sql`now() - interval '30 seconds'`)) as SQL;
}

export const matcherService = {
  async embed(kind: EmbedKind, texts: string[]): Promise<number[][]> {
    const { baseUrl, apiKey } = getConfig();
    const body: EmbedRequest = { kind, texts };

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/embed`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "Error";
      throw new MatcherUnavailableError(`Matcher request failed (${name}).`);
    }

    if (!response.ok) {
      throw new MatcherUnavailableError(`Matcher responded with status ${response.status}.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new MatcherUnavailableError("Matcher returned a non-JSON body.");
    }

    const parsed = embedResponseSchema.safeParse(payload);
    if (!parsed.success) throw new MatcherUnavailableError("Matcher returned an invalid body.");
    if (parsed.data.embeddings.length !== texts.length) {
      throw new MatcherUnavailableError("Matcher returned the wrong number of embeddings.");
    }

    return parsed.data.embeddings;
  },

  async tryEmbedOne(kind: EmbedKind, text: string): Promise<number[] | null> {
    try {
      const [vector] = await matcherService.embed(kind, [text]);
      return vector;
    } catch (error) {
      console.error(
        `[matcher] ${kind} embedding failed`,
        error instanceof Error ? error.message : "unknown error",
      );
      return null;
    }
  },
};

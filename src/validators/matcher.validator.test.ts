import { describe, expect, it } from "vitest";

import { EMBEDDING_DIM, embedResponseSchema } from "./matcher.validator";

const vector = () => Array.from({ length: EMBEDDING_DIM }, () => 0.1);

describe("embedResponseSchema", () => {
  it("accepts a valid response", () => {
    const parsed = embedResponseSchema.safeParse({
      model: "all-MiniLM-L6-v2",
      dim: 384,
      embeddings: [vector(), vector()],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a wrong dimension", () => {
    expect(
      embedResponseSchema.safeParse({ model: "m", dim: 128, embeddings: [vector()] }).success,
    ).toBe(false);
  });

  it("rejects a vector of the wrong length", () => {
    expect(
      embedResponseSchema.safeParse({ model: "m", dim: 384, embeddings: [[0.1, 0.2]] }).success,
    ).toBe(false);
  });

  it("rejects non-finite numbers", () => {
    const bad = vector();
    bad[0] = Infinity;
    expect(embedResponseSchema.safeParse({ model: "m", dim: 384, embeddings: [bad] }).success).toBe(
      false,
    );
  });
});

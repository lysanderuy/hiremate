import { z } from "zod";

export const EMBEDDING_DIM = 384;

export const embeddingVectorSchema = z.array(z.number().finite()).length(EMBEDDING_DIM);

export const embedResponseSchema = z.object({
  model: z.string().min(1),
  dim: z.literal(EMBEDDING_DIM),
  embeddings: z.array(embeddingVectorSchema),
});

export type EmbedResponse = z.infer<typeof embedResponseSchema>;

export type EmbedKind = "resume" | "listing";

export type EmbedRequest = { kind: EmbedKind; texts: string[] };

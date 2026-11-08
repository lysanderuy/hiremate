"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useRequestReview } from "@/hooks/use-request-review";

export function RequestReviewButton() {
  const router = useRouter();
  const { mutate, isPending, error } = useRequestReview();

  return (
    <>
      <Button
        type="button"
        size="lg"
        disabled={isPending}
        onClick={() => mutate(undefined, { onSuccess: () => router.refresh() })}
        className="w-full text-sm"
      >
        Ask for another review
      </Button>
      {error && (
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {error.message}
        </p>
      )}
    </>
  );
}

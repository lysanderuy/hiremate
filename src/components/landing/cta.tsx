import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl text-navy">
          Ready to find your best match?
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          Create a free account and upload your resume in under two minutes.
        </p>
        <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <Button size="lg" className="h-11 w-full sm:w-auto px-6 text-base">
            Get Started Free
          </Button>
          <Button variant="outline" size="lg" className="h-11 w-full sm:w-auto px-6 text-base">
            Sign In
          </Button>
        </div>
      </div>
    </section>
  );
}

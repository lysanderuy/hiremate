import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Upload Resume",
    description: "Upload your resume as PDF, DOCX, or TXT in seconds.",
  },
  {
    number: "02",
    title: "AI Extracts Information",
    description:
      "Our NLP engine reads your resume and pulls out key skills, experience, and education.",
  },
  {
    number: "03",
    title: "AI Analyzes Skills",
    description:
      "Your profile is compared against thousands of job descriptions using semantic matching.",
  },
  {
    number: "04",
    title: "Find Your Best Match",
    description:
      "Browse personalized job recommendations ranked by how well they match your profile.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-primary py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wider text-indigo-200 sm:text-sm uppercase">
            How it works
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl text-white">
            From resume to the right job in four steps
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className="relative gap-3 border border-white/15 bg-white/10 p-6 text-white shadow-none ring-0 transition-all hover:-translate-y-0.5 hover:bg-white/15"
            >
              <span className="text-2xl font-bold text-indigo-200">{step.number}</span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-9 right-6 hidden h-px w-8 bg-white/30 lg:block"
                />
              )}
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-indigo-100">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

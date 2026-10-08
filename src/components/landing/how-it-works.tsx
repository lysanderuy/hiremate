const steps = [
  {
    number: "01",
    title: "Save your resume",
    description:
      "Paste text or upload a .txt or text-based PDF. You keep one resume on your account.",
  },
  {
    number: "02",
    title: "We read your skills",
    description: "Skills are picked out of your resume and out of each job listing.",
  },
  {
    number: "03",
    title: "Compare by meaning",
    description:
      "Your resume and each listing are compared by skills and by meaning, not only exact words.",
  },
  {
    number: "04",
    title: "See your score, then apply",
    description: "Every listing shows your score and the skills you lack. Apply where you fit.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="section-screen bg-primary text-on-primary-muted">
      <div className="site-container">
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <p className="eyebrow text-on-primary-eyebrow">How it works</p>
          <h2 className="text-section font-semibold text-white">
            From resume to the right job in four steps
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-4 min-[641px]:grid-cols-2 min-[961px]:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.number}
              className="rounded-xl border border-white/20 bg-white/12 p-6 min-[641px]:p-8"
            >
              <div className="mb-4 flex items-center justify-between font-display text-2xl font-semibold text-white">
                {step.number}
                <span aria-hidden="true" className="h-px w-10 bg-white/40" />
              </div>
              <h3 className="mb-3 text-base font-semibold text-white">{step.title}</h3>
              <p className="text-md">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center">
          Recruiters post a listing and get applicants ranked the same way.
        </p>
      </div>
    </section>
  );
}

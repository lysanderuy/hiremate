import { Minus, Plus } from "lucide-react";

const questions = [
  {
    question: "Is the score a hiring decision?",
    answer:
      "No. It is a ranking that shows how closely a resume matches a listing. Recruiters make every decision, and a low score never blocks an application.",
  },
  {
    question: "What resume formats work?",
    answer:
      "Pasted text, a .txt file, or a text-based PDF. Scanned or image PDFs cannot be read. For a PDF, you review the extracted text before saving it.",
  },
  {
    question: "Can a recruiter see my resume before I apply?",
    answer: "No. A recruiter sees your resume only after you apply to one of their listings.",
  },
  {
    question: "Why is a skill marked as missing?",
    answer:
      "The listing asks for it and your saved resume does not mention it. If you have the skill, add it to your resume and your score updates.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="section-screen bg-page">
      <div className="site-container grid grid-cols-1 items-start gap-12 min-[961px]:grid-cols-[0.8fr_1.2fr] min-[961px]:gap-18 *:min-w-0">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 className="text-section font-semibold">Things people ask</h2>
          <p className="mt-3 text-lead">
            Short answers about the score, your resume and who sees what.
          </p>
        </div>
        <div>
          {questions.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group border-b border-line py-5 first:pt-0"
            >
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  className="size-5 shrink-0 text-muted-foreground group-open:hidden"
                  aria-hidden="true"
                />
                <Minus
                  className="hidden size-5 shrink-0 text-muted-foreground group-open:block"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 max-w-[600px]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

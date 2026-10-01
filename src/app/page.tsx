import { AiMatching } from "@/components/landing/ai-matching";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <AiMatching />
        <Cta />
      </main>
      <Footer />
    </>
  );
}

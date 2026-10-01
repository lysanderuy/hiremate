import { Logo } from "@/components/landing/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-section px-4 py-10">
      <div className="mb-8">
        <Logo href="/" />
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}

import { AuthSplit } from "@/components/auth/auth-split";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthSplit>{children}</AuthSplit>;
}

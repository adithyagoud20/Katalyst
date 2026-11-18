import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create a KATALYST account to sync learning progress across devices. Guest learning is always available.",
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return <LoginForm />;
}

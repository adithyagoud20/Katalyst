import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password — Katalyst",
  description: "Request a secure password reset link for your Katalyst account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

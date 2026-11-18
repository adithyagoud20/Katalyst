import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password — Katalyst",
  description: "Choose a new password for your Katalyst account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

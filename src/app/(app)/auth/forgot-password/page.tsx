import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "Reset KATALYST Password", description: "Request a secure password reset link for your KATALYST account.", pathname: "/auth/forgot-password", index: false });

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

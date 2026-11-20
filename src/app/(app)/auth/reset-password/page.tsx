import { ResetPasswordForm } from "@/components/reset-password-form";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "Choose a New KATALYST Password", description: "Choose a new password for your KATALYST account.", pathname: "/auth/reset-password", index: false });

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

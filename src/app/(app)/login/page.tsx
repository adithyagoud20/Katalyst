import { LoginForm } from "@/components/login-form";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "Sign In to KATALYST", description: "Sign in or create a KATALYST account to sync learning progress across devices. Guest learning is also available.", pathname: "/login", index: false });

export default function LoginPage() {
  return <LoginForm />;
}

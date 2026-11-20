import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "KATALYST Sign In", description: "Sign in to your KATALYST account.", pathname: "/signin", index: false });

export default function SignInAlias() {
  redirect("/login");
}

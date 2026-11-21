import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "KATALYST Authentication", description: "Sign in to your KATALYST account.", pathname: "/auth", index: false });

export default function AuthAlias() {
  redirect("/login");
}

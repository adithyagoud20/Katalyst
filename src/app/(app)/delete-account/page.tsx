import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "Delete a KATALYST Account", description: "Find instructions for deleting your KATALYST account.", pathname: "/delete-account", index: false });

export default function DeleteAccountAlias() {
  redirect("/account/delete");
}

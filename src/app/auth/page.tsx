import { redirect } from "next/navigation";

export default function AuthAlias() {
  redirect("/login");
}

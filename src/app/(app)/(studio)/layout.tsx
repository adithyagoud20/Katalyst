import { Workspace } from "@/components/workspace";

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><Workspace />{children}</>;
}

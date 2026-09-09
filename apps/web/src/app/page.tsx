import { redirect } from "next/navigation";

export default function HomePage() {
  // Auth is the entry point until the dashboard shell is wired up.
  redirect("/login");
}



import { redirect } from "next/navigation";

export default function StudioRootPage() {
  redirect("/studio/login");
  return null;
}
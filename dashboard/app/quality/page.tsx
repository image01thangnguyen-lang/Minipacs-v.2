import { redirect } from "next/navigation";

export default function QualityCenterPage() {
  // Quality Center is a redirect to the first sub-module
  redirect("/quality/critical-results");
}

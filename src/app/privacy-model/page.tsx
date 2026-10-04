import { redirect } from "next/navigation";

// The privacy model now lives in the docs; keep the old URL working.
export default function PrivacyModel() {
  redirect("/docs/privacy");
}

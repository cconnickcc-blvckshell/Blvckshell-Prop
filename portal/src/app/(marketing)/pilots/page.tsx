import { redirect } from "next/navigation";

/** Legacy URL — permanent redirect configured in next.config; this guards direct RSC navigation. */
export default function PilotsLegacyPage() {
  redirect("/introductory-offers");
}

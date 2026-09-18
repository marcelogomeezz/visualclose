import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "VISUALCLOSE · Studio",
};

export default function StudioPage() {
  return <Studio />;
}

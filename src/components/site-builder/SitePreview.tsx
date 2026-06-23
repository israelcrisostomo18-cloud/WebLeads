"use client";

import { GeneratedSiteRenderer } from "@/components/generated-site/GeneratedSiteRenderer";
import type { GeneratedSiteRenderData } from "@/components/generated-site/types";

export function SitePreview({
  data,
  mode,
}: {
  data: GeneratedSiteRenderData;
  mode: "desktop" | "tablet" | "mobile";
}) {
  const previewWidth = mode === "mobile" ? "max-w-[390px]" : mode === "tablet" ? "max-w-[760px]" : "max-w-6xl";

  return (
    <div className="scroll-stable max-h-[calc(100vh-170px)] overflow-y-auto rounded-xl bg-[#e8edf5] p-4">
      <div className={`mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl ${previewWidth}`}>
        <GeneratedSiteRenderer data={data} />
      </div>
    </div>
  );
}

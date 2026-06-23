"use client";

import type { ReactNode } from "react";

export function SiteEditor({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <section className="grid gap-4 p-4 xl:grid-cols-[320px_1fr_360px]">
      <aside className="premium-panel scroll-stable max-h-[calc(100vh-96px)] overflow-y-auto rounded-2xl p-4">{left}</aside>
      <section className="premium-panel min-h-[70vh] rounded-2xl p-4">{center}</section>
      <aside className="premium-panel scroll-stable max-h-[calc(100vh-96px)] overflow-y-auto rounded-2xl p-4">{right}</aside>
    </section>
  );
}

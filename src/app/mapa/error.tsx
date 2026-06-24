"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function MapaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("WebLeads /mapa render error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main className="premium-shell grid min-h-screen place-items-center p-6 text-center">
      <section className="premium-panel max-w-xl rounded-2xl p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-xl border border-[#f472b6]/35 bg-[#f472b6]/12 text-[#ffd4e8]">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-white">Não foi possível carregar o mapa.</h1>
        <p className="mt-3 text-sm leading-6 text-[#95a7bd]">
          O WebLeads encontrou um erro de renderização nesta tela. Tente recarregar; se continuar, volte ao mapa
          publicado pelo link principal.
        </p>
        <button
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#6ee7ff]/30 bg-[#21d4fd] px-4 text-sm font-black text-[#06101d]"
          onClick={reset}
        >
          <RefreshCw className="size-4" />
          Tentar novamente
        </button>
      </section>
    </main>
  );
}

import Link from "next/link";

export default function CriarSiteSemLeadPage() {
  return (
    <main className="premium-shell grid min-h-screen place-items-center p-6 text-center">
      <section className="premium-panel max-w-lg rounded-2xl p-8">
        <h1 className="text-2xl font-black text-white">Lead não encontrado.</h1>
        <p className="mt-3 text-[#95a7bd]">Volte para o mapa e selecione uma empresa para criar o site com IA.</p>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#6ee7ff] px-4 font-bold text-[#06101d]"
          href="/mapa"
        >
          Voltar para o mapa
        </Link>
      </section>
    </main>
  );
}

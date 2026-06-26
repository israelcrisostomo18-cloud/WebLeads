import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, LogIn } from "lucide-react";

const contentByStatus = {
  success: {
    icon: CheckCircle2,
    title: "Pagamento recebido",
    text: "Assim que o Mercado Pago confirmar o webhook, seu acesso fica liberado para o email da compra.",
    tone: "text-emerald-200",
  },
  pending: {
    icon: Clock,
    title: "Pagamento pendente",
    text: "Pix pendente nao libera acesso ainda. Aguarde a confirmacao de pagamento aprovado.",
    tone: "text-amber-200",
  },
  failure: {
    icon: AlertCircle,
    title: "Pagamento nao aprovado",
    text: "O acesso nao foi liberado. Tente novamente ou escolha outra forma de pagamento.",
    tone: "text-rose-200",
  },
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; email?: string }>;
}) {
  const params = await searchParams;
  const status = params.status === "pending" || params.status === "failure" ? params.status : "success";
  const content = contentByStatus[status];
  const Icon = content.icon;

  return (
    <main className="home-3d-shell grid min-h-screen place-items-center px-5 py-10 text-white">
      <div className="home-3d-grid" />
      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-white/12 bg-white/8 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <Icon className={`mx-auto size-12 ${content.tone}`} />
        <h1 className="mt-5 text-3xl font-black">{content.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">{content.text}</p>
        {params.email ? (
          <div className="mx-auto mt-4 max-w-md rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">
            Email: {params.email}
          </div>
        ) : null}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition-colors hover:bg-white"
            href="/login"
          >
            <LogIn className="size-4" />
            Fazer login
          </Link>
          <Link className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8 px-5 text-sm font-bold text-white" href="/#planos">
            Ver planos
          </Link>
        </div>
      </section>
    </main>
  );
}

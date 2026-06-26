"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; redirectTo?: string } | null;

    setIsLoading(false);

    if (!response.ok) {
      setMessage(payload?.error ?? "Nao foi possivel entrar agora.");
      return;
    }

    window.location.href = payload?.redirectTo ?? "/mapa";
  }

  return (
    <main className="home-3d-shell grid min-h-screen place-items-center px-5 py-10 text-white">
      <div className="home-3d-grid" />
      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/12 bg-white/8 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <div className="grid size-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/12 text-cyan-100">
          <LockKeyhole className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-black">Entrar na ferramenta</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Use o mesmo email informado no pagamento. O acesso so e liberado quando a assinatura estiver ativa.
        </p>

        <form className="mt-6 grid gap-3" onSubmit={submitLogin}>
          <label className="grid gap-2 text-sm font-bold text-slate-200">
            Email da compra
            <span className="flex items-center gap-2 rounded-2xl border border-white/12 bg-slate-950/60 px-3">
              <Mail className="size-4 text-cyan-200" />
              <input
                className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                required
              />
            </span>
          </label>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Verificando..." : "Entrar"}
            <ArrowRight className="size-4" />
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-2xl border border-amber-300/24 bg-amber-300/10 p-3 text-sm font-bold text-amber-100">
            {message}
          </div>
        ) : null}

        <Link className="mt-5 inline-flex text-sm font-bold text-cyan-100 hover:text-white" href="/#planos">
          Ainda nao comprei. Ver planos
        </Link>
      </section>
    </main>
  );
}

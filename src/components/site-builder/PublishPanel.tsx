"use client";

import { Copy, FilePlus2, Loader2, Send } from "lucide-react";

export function PublishPanel({
  publicLink,
  isSaving,
  whatsappUrl,
  onPublish,
  onCopyLink,
  onCopyProposal,
}: {
  publicLink: string;
  isSaving: boolean;
  whatsappUrl: string | null;
  onPublish: () => void;
  onCopyLink: () => void;
  onCopyProposal: () => void;
}) {
  return (
    <div className="grid gap-2">
      <button className="lead-action border-[#6ee7ff]/32 bg-[#21d4fd] text-[#06101d]" disabled={isSaving} onClick={onPublish} type="button">
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
        Publicar link temporário
      </button>
      <button className="lead-action" disabled={!publicLink} onClick={onCopyLink} type="button">
        <Copy className="size-4" />
        Copiar link
      </button>
      <button className="lead-action" disabled={!publicLink} onClick={onCopyProposal} type="button">
        <Copy className="size-4" />
        Copiar proposta
      </button>
      {whatsappUrl ? (
        <a className="lead-action border-[#20b15a]/30 bg-[#20b15a]/18 text-[#d7ffe5]" href={whatsappUrl} rel="noreferrer">
          <Send className="size-4" />
          Enviar proposta
        </a>
      ) : null}
    </div>
  );
}

import { toast } from "sonner";
import { salvarAssinatura, type Participante } from "@/lib/presenca";
import { DialogoAssinatura } from "./DialogoAssinatura";

export function AssinaturaParticipante({ participante, onFechar, onSalvo }: { participante: Participante | null; onFechar: () => void; onSalvo: () => void }) {
  if (!participante) return null;
  return <DialogoAssinatura open titulo={`Assinatura — ${participante.nome}`} onFechar={onFechar} onSalvar={async imagem => { await salvarAssinatura(participante.id, imagem); onSalvo(); toast.success("Assinatura salva."); }} />;
}

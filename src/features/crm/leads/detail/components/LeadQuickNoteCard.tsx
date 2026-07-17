import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LeadQuickNoteCardProps {
  newNote: string;
  canSaveNote: boolean;
  noteMutationPending: boolean;
  onNewNoteChange: (value: string) => void;
  onSubmitNote: (event: React.FormEvent<HTMLFormElement>) => void;
}

const LeadQuickNoteCard = ({
  newNote,
  canSaveNote,
  noteMutationPending,
  onNewNoteChange,
  onSubmitNote,
}: LeadQuickNoteCardProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 text-primary">
        <Send className="h-4 w-4" />
        <h2 className="font-semibold text-foreground">Anotação rápida</h2>
      </div>
      <form onSubmit={onSubmitNote} className="mt-4 space-y-3">
        <textarea
          value={newNote}
          onChange={(event) => onNewNoteChange(event.target.value)}
          placeholder="Registre contexto comercial, objecoes ou combinados."
          disabled={!canSaveNote}
          className="min-h-[140px] w-full rounded-2xl border border-input bg-background/70 px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button type="submit" className="w-full" disabled={noteMutationPending || !newNote.trim() || !canSaveNote}>
          Salvar nota
        </Button>
        {!canSaveNote ? (
          <p className="text-sm text-muted-foreground">Sem permissão para registrar anotações neste lead.</p>
        ) : null}
      </form>
    </section>
  );
};

export default LeadQuickNoteCard;

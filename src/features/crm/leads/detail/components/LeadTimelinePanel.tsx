import { History, Package } from "lucide-react";
import { cn } from "@/utils/cn";
import type { buildLeadTimelineItems } from "@/lib/crmTimeline";

interface LeadTimelinePanelProps {
  timelineItems: ReturnType<typeof buildLeadTimelineItems>;
  loading: boolean;
}

const LeadTimelinePanel = ({ timelineItems, loading }: LeadTimelinePanelProps) => {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-6 py-5">
        <History className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold text-foreground">Timeline de atividades</h2>
          <p className="text-sm text-muted-foreground">
            Notas, agenda e mudancas de pipeline aparecem no mesmo histórico.
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Sincronizando timeline...</p>
        ) : timelineItems.length > 0 ? (
          <div className="space-y-5">
            {timelineItems.map((item) => (
              <article key={item.id} className="flex gap-4">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    item.tone === "primary" && "bg-primary/10 text-primary",
                    item.tone === "success" && "bg-secondary/10 text-secondary",
                    item.tone === "muted" && "bg-muted text-muted-foreground",
                  )}
                >
                  {item.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {item.content ? (
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      {item.content}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-12 text-center text-sm text-muted-foreground">
            <Package className="h-8 w-8" />
            Nenhuma atividade registrada ainda.
          </div>
        )}
      </div>
    </section>
  );
};

export default LeadTimelinePanel;

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Building2, CheckCircle2, ClipboardCheck, ShieldCheck, UsersRound } from "lucide-react";

const proofMetrics = [
  {
    value: "14 dias",
    label: "para validar aderência antes da contratação",
    source: "Fonte: regra comercial do teste grátis Jornada.",
  },
  {
    value: "3 áreas",
    label: "conectadas no mesmo fluxo: RH, DP e liderança",
    source: "Fonte: escopo operacional apresentado na plataforma.",
  },
  {
    value: "1 painel",
    label: "para acompanhar registros, pendências e ajustes",
    source: "Fonte: captura real do produto exibida na landing.",
  },
] as const;

const operatingSegments = ["Equipes presenciais", "Timês externos", "Rotinas híbridas"] as const;

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-background py-24" aria-labelledby="trust-title">
      <div className="container" ref={ref}>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span className="section-kicker">Prova operacional</span>
            <h2 id="trust-title" className="section-title mt-3 max-w-xl">
              Menos promessa, mais critério concreto para avaliar a Jornada.
            </h2>
            <p className="section-copy mt-5 max-w-xl">
              Sem logos ou depoimentos públicos verificáveis no momento, a página passa a mostrar evidências que o comprador consegue conferir durante a demonstração: escopo, prazo de teste e superfície real do produto.
            </p>

            <div className="mt-8 flex flex-wrap gap-3" aria-label="Segmentos operacionais atendidos">
              {operatingSegments.map((segment) => (
                <span key={segment} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-extrabold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {segment}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {proofMetrics.map((metric, index) => (
                <article
                  key={metric.value}
                  className={`rounded-lg border border-border bg-card p-6 shadow-sm ${
                    isVisible ? "animate-fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <strong className="block text-3xl font-extrabold text-primary">{metric.value}</strong>
                  <p className="mt-3 text-sm font-bold leading-6 text-foreground">{metric.label}</p>
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">{metric.source}</p>
                </article>
              ))}
            </div>

            <div
              className={`rounded-lg border border-primary/20 bg-primary/5 p-6 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: "0.24s" }}
            >
              <div className="grid gap-5 md:grid-cols-3">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm font-bold leading-6 text-foreground">Controle de acesso e dados sensíveis considerados na rotina.</p>
                </div>
                <div className="flex gap-3">
                  <ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm font-bold leading-6 text-foreground">Histórico de ajustes para conferência e acompanhamento.</p>
                </div>
                <div className="flex gap-3">
                  <UsersRound className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm font-bold leading-6 text-foreground">Implantação assistida para reduzir atrito no início do uso.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-extrabold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Pontos conferíveis na demonstração comercial.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;

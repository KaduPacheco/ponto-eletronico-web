import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Building2, CheckCircle2, ClipboardCheck, ShieldCheck, UsersRound } from "lucide-react";

const demoHighlights = [
  {
    title: "14 dias para testar a plataforma",
    description: "Valide a aderência do Jornada antes da contratação.",
  },
  {
    title: "RH, DP e liderança no mesmo fluxo",
    description: "Acompanhe a rotina de jornada com as áreas envolvidas no processo.",
  },
  {
    title: "Um painel para registros, pendências e ajustes",
    description: "Veja a operação centralizada durante a demonstração.",
  },
] as const;

const operatingSegments = ["Equipes presenciais", "Times externos", "Rotinas híbridas"] as const;

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-background py-24" aria-labelledby="trust-title">
      <div className="container" ref={ref}>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span className="section-kicker">Conheça antes de contratar</span>
            <h2 id="trust-title" className="section-title mt-3 max-w-xl">
              Veja o Jornada funcionando na rotina da sua empresa.
            </h2>
            <p className="section-copy mt-5 max-w-xl">
              Veja o Jornada funcionando em uma demonstração orientada à sua rotina. Depois, teste a plataforma por 14 dias com apoio na configuração inicial.
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
              {demoHighlights.map((highlight, index) => (
                <article
                  key={highlight.title}
                  className={`rounded-lg border border-border bg-card p-6 shadow-sm ${
                    isVisible ? "animate-fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <strong className="block text-lg font-extrabold leading-7 text-foreground">{highlight.title}</strong>
                  <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">{highlight.description}</p>
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

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import productMockup from "@/assets/images/jornada-product-mockup-v2.png";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardList } from "lucide-react";

const productFlows = [
  {
    icon: ClipboardList,
    eyebrow: "Fluxo 01",
    title: "Captura e organiza a jornada",
    description: "Centralize marcações, ausências, horas extras e ajustes em uma rotina única para RH, DP e gestores.",
  },
  {
    icon: AlertTriangle,
    eyebrow: "Fluxo 02",
    title: "Mostra pendências antes do fechamento",
    description: "Evidencie desvios durante o mês para a equipe agir antes que inconsistências virem retrabalho.",
  },
  {
    icon: BarChart3,
    eyebrow: "Fluxo 03",
    title: "Entrega contexto para decidir",
    description: "Acompanhe tendências, histórico de ajustes e pontos críticos com leitura simples para liderança.",
  },
] as const;

const Solution = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="solucao" className="bg-section-alt py-24" aria-labelledby="solution-title">
      <div className="container" ref={ref}>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="section-kicker">Como a plataforma ajuda</span>
          <h2 id="solution-title" className="section-title mt-3">
            Uma operação de ponto mais clara, acompanhável e profissional.
          </h2>
          <p className="section-copy mt-4">
            A Jornada reúne rotina, ajustes e acompanhamento operacional em uma experiência simples para RH, DP e liderança.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.78fr_minmax(0,1.22fr)] lg:items-center">
          <div className="space-y-4">
            {productFlows.map((flow, index) => (
              <article
                key={flow.title}
                className={`rounded-lg border border-border bg-card p-6 shadow-sm ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <flow.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">{flow.eyebrow}</span>
                    <h3 className="mt-2 text-xl font-extrabold text-foreground">{flow.title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{flow.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <figure
            className={`rounded-lg border border-border bg-card shadow-2xl shadow-primary/10 ${
              isVisible ? "animate-fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "0.22s" }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border bg-white px-5 py-4">
              <div>
                <figcaption className="text-sm font-extrabold text-foreground">Painel operacional da plataforma</figcaption>
                <p className="text-xs font-semibold text-muted-foreground">Visão consolidada para acompanhamento mensal</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Em acompanhamento
              </div>
            </div>
            <div className="relative overflow-hidden bg-[#eef5f1] px-4 pb-7 pt-5 sm:px-6 sm:pb-10 sm:pt-7">
              <div className="relative mx-auto max-w-[920px]">
                <div className="overflow-hidden rounded-t-lg border border-[#183f39]/18 bg-[#133a35] p-2 shadow-[0_24px_70px_rgba(17,107,96,.20)] sm:p-3">
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff8b66]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#52d6bd]" />
                  </div>
                  <img
                    src={productMockup}
                    alt="Captura real do painel Jornada com indicadores e acompanhamento operacional"
                    width={1586}
                    height={992}
                    className="h-auto w-full rounded-md object-contain"
                  />
                </div>
                <div className="mx-auto h-3 w-[82%] rounded-b-[22px] bg-[#cfdad5] shadow-inner" />

                <div className="absolute -bottom-5 right-0 hidden w-[26%] min-w-[120px] max-w-[190px] rounded-[1.65rem] border-[7px] border-[#122d2a] bg-[#122d2a] shadow-[0_18px_45px_rgba(0,0,0,.28)] sm:block">
                  <div className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/20" />
                  <div className="aspect-[9/16] overflow-hidden rounded-[1.15rem] bg-white">
                    <img
                      src={productMockup}
                      alt=""
                      width={1586}
                      height={992}
                      aria-hidden="true"
                      className="h-full w-full object-cover object-left-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default Solution;

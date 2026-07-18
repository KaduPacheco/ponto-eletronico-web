import { Button } from "@/components/ui/Button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { trackCtaClick } from "@/services/analyticsService";
import { Check, CircleHelp, Clock, Zap } from "lucide-react";

const features = [
  "Registro de ponto digital",
  "Relatórios de jornada e fechamento",
  "Controle de horas extras e banco de horas",
  "Acesso por celular ou computador",
  "Suporte humano para os primeiros passos",
] as const;

const Pricing = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="precos" className="bg-section-alt py-24" aria-labelledby="pricing-title">
      <div className="container" ref={ref}>
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="section-kicker">Plano de entrada</span>
          <h2 id="pricing-title" className="section-title mt-3">
            Um ponto de partida claro para digitalizar o controle de jornada.
          </h2>
          <p className="section-copy mx-auto mt-4 max-w-2xl">
            Preço de entrada acessível, demonstração consultiva e teste grátis de 14 dias para validar aderência antes da contratação.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-8 md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <Zap className="h-4 w-4" /> Ideal para começar sem complexidade
            </div>

            <h3 className="text-2xl font-extrabold text-foreground md:text-3xl">Plano Jornada</h3>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              Para empresas que precisam organizar jornada, ganhar visibilidade operacional e reduzir retrabalho no fechamento da folha.
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-extrabold text-foreground">R$ 59,90</span>
              <span className="pb-1 text-lg text-muted-foreground">/mês para até 5 funcionários</span>
            </div>

            <p className="mt-3 inline-flex rounded-lg bg-muted px-4 py-2 text-sm font-bold text-foreground">
              + R$ 7,00 por funcionário adicional
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm font-semibold text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`relative bg-[#0b302d] p-8 text-white md:p-10 ${
              isVisible ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-lg bg-[#f47c36] px-4 py-2 text-xs font-extrabold uppercase text-white">
              <Clock className="h-3.5 w-3.5" /> Teste grátis de 14 dias
            </div>

            <h3 className="text-2xl font-extrabold">Por que começar por este plano</h3>
            <p className="mt-3 leading-7 text-white/72">
              Valide a rotina, o custo e a implantação antes de contratar.
            </p>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
              {[
                "Preço inicial claro para começar com previsibilidade.",
                "Cobrança acompanha o crescimento da equipe.",
                "Demonstração e teste reduzem risco antes da contratação.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[#f59b58]" />
                  <p className="text-sm leading-6 text-white/86">{item}</p>
                </div>
              ))}
            </div>

            <Button
              variant="default"
              className="mt-8 h-14 w-full rounded-lg text-base font-extrabold shadow-none"
              asChild
            >
              <a
                href="#contato"
                onClick={() => {
                  void trackCtaClick({
                    cta_id: "pricing_cta_solicitar_demonstração",
                    cta_label: "Solicitar demonstração",
                    placement: "pricing",
                    target: "#contato",
                  });
                }}
              >
                Solicitar demonstração
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

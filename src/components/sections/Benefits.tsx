// Preservado fora do fluxo principal da landing para referência editorial e rollback seguro.
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BarChart2, Clock3, ScanSearch, Users } from "lucide-react";

const benefits = [
  {
    icon: Clock3,
    title: "Mais agilidade no fechamento",
    description: "Reduza o tempo gasto com conferências repetitivas e concentre o time no que realmente precisa de análise.",
  },
  {
    icon: ScanSearch,
    title: "Menos retrabalho na conferência",
    description: "Organize a rotina de ajustes e validações com mais contexto, em vez de corrigir tudo na reta final.",
  },
  {
    icon: BarChart2,
    title: "Visibilidade em tempo real",
    description: "Acompanhe indicadores operacionais da jornada e identifique desvios com mais rapidez ao longo do mês.",
  },
  {
    icon: Users,
    title: "Mais clareza entre RH e lideranças",
    description: "Unifique a leitura da jornada para reduzir ruído entre quem opera, aprova e fechá as informações.",
  },
] as const;

const Benefits = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-muted/30 py-24" aria-labelledby="benefits-title">
      <div className="container" ref={ref}>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-secondary">Resultados esperados</span>
          <h2 id="benefits-title" className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            O ganho está na rotina: menos esforço, mais previsibilidade.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A landing deixa claro o que importa para quem compra: controle operacional, rastreabilidade e mais confiança nas
            decisões ligadas à jornada.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <article
              key={benefit.title}
              className={`rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-300 hover:border-secondary/40 hover:shadow-lg ${
                isVisible ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <benefit.icon className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{benefit.title}</h3>
              <p className="leading-7 text-muted-foreground">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;

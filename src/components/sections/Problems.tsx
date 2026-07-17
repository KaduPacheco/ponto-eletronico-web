import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { AlertCircle, FileSpreadsheet, Hourglass } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Fechamento da folha com retrabalho",
    description:
      "Quando o controle da jornada depende de conferência manual, o RH perde horas conciliando dados e corrigindo inconsistências.",
  },
  {
    icon: AlertCircle,
    title: "Erros de jornada que viram custo",
    description:
      "Ajustes em cima da hora e registros mal acompanhádos aumentam risco de pagamentos indevidos e discussões futuras.",
  },
  {
    icon: Hourglass,
    title: "Horas extras sem previsibilidade",
    description:
      "Sem leitura clara da rotina, o gestor descobre desvios tarde demais e perde margem operacional no mês.",
  },
] as const;

const Problems = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="problemas" className="bg-background py-24" aria-labelledby="problems-title">
      <div className="container" ref={ref}>
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <span className="section-kicker text-destructive">Onde a rotina trava</span>
            <h2 id="problems-title" className="section-title mt-3 max-w-xl">
              O problema não é só registrar o ponto. É confiar no fechamento.
            </h2>
            <p className="section-copy mt-5 max-w-xl">
              Empresas que operam com controles frágeis pagam a conta em horas perdidas, decisões lentas e maior exposição em rotinas sensíveis do DP.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {problems.map((problem, index) => (
              <article
                key={problem.title}
                className={`flex gap-5 border-b border-border p-7 last:border-b-0 transition-colors hover:bg-section-alt ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <problem.icon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-extrabold text-foreground">{problem.title}</h3>
                  <p className="leading-7 text-muted-foreground">{problem.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problems;

// Preservado fora do fluxo principal da landing para referência editorial e rollback seguro.
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Building2, Factory, HeadphonesIcon, MonitorSmartphone, Rocket, Shield } from "lucide-react";

const useCases = [
  {
    icon: Building2,
    title: "Varejo e franquias",
    description: "Gestão descentralizada de ponto para múltiplas filiais, controle de escalas complexas e consolidação de dados em tempo real.",
  },
  {
    icon: Factory,
    title: "Indústria e manufatura",
    description: "Conformidade rigorosa com escalas alternadas, apontamentos noturnos e adequação total às convenções coletivas.",
  },
  {
    icon: MonitorSmartphone,
    title: "Serviços e tecnologia",
    description: "Flexibilidade para regimes híbridos, banco de horas dinâmico e integração com sistemas já usados pela operação.",
  },
] as const;

const differentials = [
  {
    icon: Shield,
    title: "Segurança e conformidade MTE",
    description: "Adequação estrita às portarias aplicáveis e estruturação orientada à proteção de dados e rastreabilidade.",
  },
  {
    icon: Rocket,
    title: "Implantação consultiva",
    description: "Transição segura a partir das planilhas ou software antigo, com apoio para reduzir fricção operacional.",
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte técnico especializado",
    description: "Atendimento realizado por especialistas que conhecem a rotina de um departamento pessoal.",
  },
] as const;

const SocialProof = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-background py-24">
      <div className="container" ref={ref}>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Maturidade operacional</span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Pronto para a realidade de <span className="text-primary">operações complexas</span>
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Desenvolvido para aténder aos setores mais exigentes com estabilidade e segurança jurídica.
          </p>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {useCases.map((useCase, index) => (
            <div
              key={useCase.title}
              className={`rounded-2xl border bg-card p-8 shadow-sm ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <useCase.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{useCase.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{useCase.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-slate-50 p-8 md:p-12 dark:bg-card/50">
          <div className="grid gap-8 text-center md:grid-cols-3 md:gap-12 md:text-left">
            {differentials.map((differential, index) => (
              <div
                key={differential.title}
                className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${0.3 + index * 0.15}s` }}
              >
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm md:mx-0">
                  <differential.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mb-2 font-bold text-foreground">{differential.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{differential.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;

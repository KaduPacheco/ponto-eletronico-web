// Preservado fora do fluxo principal da landing para referência editorial e rollback seguro.
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { DatabaseBackup, FileSignature, Lock } from "lucide-react";

const pillars = [
  {
    icon: FileSignature,
    title: "Rotinas voltadas à conformidade operacional",
    description:
      "A plataforma foi desenhada para apoiar processos de controle de jornada com mais organização, conferência e responsabilidade operacional.",
  },
  {
    icon: Lock,
    title: "Proteção de dados e acesso",
    description:
      "A operação em nuvem ajuda a manter disponibilidade e controle sobre informações sensíveis usadas no contexto comercial e operacional.",
  },
  {
    icon: DatabaseBackup,
    title: "Histórico e rastreabilidade",
    description:
      "Registros, ajustes e dados relevantes podem ser acompanhádos com mais contexto, o que fortalece rotinas de auditoria e conferência.",
  },
] as const;

const Security = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="bg-muted/30 py-24" aria-labelledby="security-title">
      <div className="container" ref={ref}>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Segurança e rastreabilidade</span>
          <h2 id="security-title" className="mt-3 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Mais confiança para operar um processo sensível todos os mêses.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Em controle de jornada, percepção de qualidade também vem de segurança, clareza de processo e capacidade de conferência.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              className={`rounded-2xl border bg-card p-8 transition-shadow hover:shadow-md ${
                isVisible ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <pillar.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{pillar.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Como os funcionários registram o ponto?",
    answer:
      "O registro pode ser feito pelos canais suportados pela plataforma, conforme a rotina definida para a empresa. Na implantação, ajustamos o fluxo mais adequado para a operação.",
  },
  {
    question: "Funciona para equipe externa, presencial e home office?",
    answer:
      "Sim. A plataforma acompanha diferentes rotinas de trabalho com gestão centralizada para RH, DP e lideranças.",
  },
  {
    question: "Como funciona o teste grátis?",
    answer:
      "O teste grátis de 14 dias valida a aderência da plataforma a rotina da empresa após o alinhamento inicial com o time comercial.",
  },
  {
    question: "O sistema ajuda no fechamento da folha?",
    answer:
      "Sim. A plataforma organiza informações da jornada para reduzir retrabalho, facilitar conferências e apoiar o fechamento com mais clareza.",
  },
  {
    question: "Preciso de relógio de ponto físico?",
    answer:
      "Não necessariamente. A avaliação inicial considera a rotina da empresa para definir o fluxo mais adequado dentro do que a plataforma suporta hoje.",
  },
  {
    question: "Como funciona a implantação?",
    answer:
      "A implantação começa com alinhamento do cenário da empresa e apoio inicial para reduzir atrito no começo do uso.",
  },
] as const;

const FaqSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="faq" className="bg-background py-24" aria-labelledby="faq-title">
      <div className="container" ref={ref}>
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="section-kicker">Perguntas frequentes</span>
          <h2 id="faq-title" className="section-title mt-3">
            Respostas objetivas para a avaliação inicial da sua operação.
          </h2>
          <p className="section-copy mt-4">
            Principais pontos sobre uso, implantação, teste e aderência da plataforma antes da demonstração.
          </p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {faqs.map((item, index) => (
            <details
              key={item.question}
              className={`group ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-left text-lg font-extrabold text-foreground transition-colors hover:bg-section-alt [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-6 leading-7 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

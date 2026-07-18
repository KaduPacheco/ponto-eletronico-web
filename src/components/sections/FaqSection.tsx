import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Como os funcionários registram o ponto?",
    answer:
      "Os funcionários podem registrar o ponto pelo próprio celular ou em um dispositivo fixo disponibilizado pela empresa, como tablet, computador ou telefone. Durante a implantação, definimos o formato mais adequado para a rotina da equipe.",
  },
  {
    question: "Funciona para equipe externa, presencial e home office?",
    answer:
      "Sim. O Jornada atende rotinas presenciais, externas e híbridas, mantendo os registros e ajustes em um painel central para RH, DP e liderança.",
  },
  {
    question: "O sistema usa localização no registro de ponto?",
    answer:
      "A localização pode ser considerada conforme o formato de registro definido para a empresa e as permissões do dispositivo. Na demonstração, avaliamos se esse recurso faz sentido para a rotina e a política interna.",
  },
  {
    question: "Preciso de relógio de ponto físico?",
    answer:
      "Não necessariamente. A empresa pode operar com celular ou dispositivo fixo, dependendo da rotina da equipe. A implantação ajuda a escolher o modelo mais simples e seguro para o dia a dia.",
  },
  {
    question: "Consigo liberar acesso para o contador?",
    answer:
      "Sim. A operação pode ser organizada para facilitar a conferência das informações por quem apoia o fechamento, incluindo contador ou responsável externo, conforme o acesso definido pela empresa.",
  },
  {
    question: "Quais relatórios ajudam no fechamento?",
    answer:
      "A plataforma organiza registros de jornada, pendências, ajustes, horas extras e banco de horas para apoiar a conferência antes do fechamento da folha.",
  },
  {
    question: "Como funciona o teste grátis?",
    answer:
      "O teste grátis de 14 dias começa após o alinhamento inicial, para validar a aderência da plataforma à rotina da empresa com apoio na configuração inicial.",
  },
  {
    question: "O Jornada está adequado à Portaria 671?",
    answer:
      "O Jornada foi estruturado para apoiar rotinas de controle de jornada com rastreabilidade e organização dos registros. A adequação final depende do uso correto pela empresa, da configuração adotada e da orientação contábil ou jurídica aplicável ao seu caso.",
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

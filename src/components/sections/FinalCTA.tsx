// Preservado fora do fluxo principal da landing para referência editorial e rollback seguro.
import { Button } from "@/components/ui/Button";
import { trackCtaClick } from "@/services/analyticsService";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Se a folha fechá no sufoco, vale ver como essa rotina pode ficar mais leve.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/82 md:text-xl">
            A próxima etapa é simples: entender o seu cenário, mostrar a plataforma e avaliar se ela faz sentido para a sua operação.
          </p>

          <div className="mt-10 flex justify-center">
            <Button size="lg" variant="hero" className="h-14 rounded-xl px-10 text-lg font-bold shadow-xl" asChild>
              <a
                href="#contato"
                onClick={() => {
                  void trackCtaClick({
                    cta_id: "final_cta_solicitar_demonstração",
                    cta_label: "Solicitar demonstração final",
                    placement: "final_cta",
                    target: "#contato",
                  });
                }}
              >
                Solicitar demonstração
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm font-medium text-primary-foreground/80">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
              Conversa comercial objetiva
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
              Teste grátis de 14 dias
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
              Apoio inicial na implantação
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

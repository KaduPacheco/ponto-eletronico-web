import { Button } from "@/components/ui/Button";
import { trackCtaClick } from "@/services/analyticsService";
import { ArrowRight, Check, Clock } from "lucide-react";

const track = (id: string, label: string, target: string) => void trackCtaClick({ cta_id: id, cta_label: label, placement: "hero", target });

const proofItems = ["14 dias grátis", "Implantação assistida", "Suporte humano"] as const;

const Hero = () => (
  <section className="relative overflow-hidden bg-[#062724] pb-12 pt-28 text-white md:pb-16 md:pt-32">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(115,234,214,.18),transparent_34%),linear-gradient(135deg,#062724_0%,#0b3935_55%,#062724_100%)]" />
    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
    <div className="container relative z-10">
      <div className="grid min-h-[620px] items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
        <div className="max-w-[720px]">
          <h1 className="max-w-[690px] text-5xl font-extrabold leading-[1.04] tracking-normal sm:text-6xl lg:text-[4rem]">
            Controle de ponto <span className="text-[#73ead6]">sem retrabalho</span> no fechamento.
          </h1>
          <p className="mt-6 max-w-[620px] text-lg leading-8 text-white/72 md:text-xl">
            Centralize registros, ajustes, horas extras e relatórios em uma plataforma simples para RH, DP e gestores.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="lg" className="h-14 rounded-lg px-8 text-base shadow-[0_18px_45px_rgba(17,107,96,.32)] hover:scale-100" asChild><a href="#contato" onClick={() => track("hero_cta_solicitar_demonstração", "Solicitar demonstração", "#contato")}>Solicitar demonstração <ArrowRight className="h-5 w-5" /></a></Button>
            <Button variant="outline" size="lg" className="h-14 rounded-lg border-white/16 bg-white/6 px-8 text-base font-bold text-white hover:bg-white/12 hover:text-white" asChild><a href="#solucao" onClick={() => track("hero_cta_entender_como_funciona", "Ver como funciona", "#solucao")}>Ver como funciona</a></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/70">
            {proofItems.map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#73ead6]" />{item}</span>)}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[680px] lg:mx-0">
          <div className="relative overflow-hidden rounded-lg border border-white/14 bg-white/[0.09] p-4 shadow-[0_28px_80px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-5">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,0)_45%)]" />
            <img
              src="/images/hero-jornada.png"
              alt="Painel da plataforma Jornada com visao geral, registros e aplicativo movel"
              width={1672}
              height={941}
              decoding="async"
              fetchPriority="high"
              className="relative z-10 h-auto w-full rounded-lg object-contain contrast-[1.08] saturate-[1.08]"
            />
          </div>
          <div className="absolute -bottom-4 left-4 z-20 flex items-center gap-3 rounded-lg border border-white/18 bg-[#fbfffd] px-4 py-3 text-[#0a312d] shadow-[0_18px_44px_rgba(0,0,0,.26)] sm:-left-5 sm:bottom-10">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dcfff6] text-[#116b60]">
              <Clock className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold">Ponto registrado</span>
              <span className="block text-xs font-semibold text-[#52716d]">Hoje, 08:02</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);
export default Hero;

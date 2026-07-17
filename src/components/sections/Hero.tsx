import { Button } from "@/components/ui/Button";
import heroMockup from "@/assets/images/jornada-hero-boardroom-v5.png";
import { trackCtaClick } from "@/services/analyticsService";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const track = (id: string, label: string, target: string) => void trackCtaClick({ cta_id: id, cta_label: label, placement: "hero", target });

const proofItems = ["14 dias grátis", "Implantação assistida", "Suporte humano"] as const;

const Hero = () => (
  <section className="relative min-h-[760px] overflow-hidden bg-[#061d1b] pb-12 pt-28 text-white md:pb-14 md:pt-32">
    <img
      src={heroMockup}
      alt=""
      aria-hidden="true"
      width={1536}
      height={1024}
      decoding="async"
      fetchPriority="high"
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,29,27,.96)_0%,rgba(6,29,27,.86)_30%,rgba(6,29,27,.34)_62%,rgba(6,29,27,.08)_100%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,29,27,.32)_0%,rgba(6,29,27,.06)_48%,rgba(6,29,27,.9)_100%)]" />
    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-background" />
    <div className="container relative z-10">
      <div className="flex min-h-[620px] items-center">
        <div className="max-w-[760px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-4 py-2 text-sm font-bold text-[#9af4e4] shadow-2xl shadow-black/10 backdrop-blur">
            <Sparkles className="h-4 w-4" /> Plataforma de ponto para operações exigentes
          </div>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
            Controle de jornada &agrave; altura da sua opera&ccedil;&atilde;o. <span className="text-[#9af4e4]">Vis&atilde;o executiva para um DP mais leve.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
            Centralize registros, ajustes, horas extras e sinais de risco em uma experi&ecirc;ncia clara, confi&aacute;vel e pronta para decis&otilde;es melhores &mdash; do primeiro acesso ao fechamento da folha.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="lg" className="h-14 rounded-lg px-8 text-base shadow-[0_18px_45px_rgba(17,107,96,.32)] hover:scale-100" asChild><a href="#contato" onClick={() => track("hero_cta_solicitar_demonstração", "Conhecer a Jornada", "#contato")}>Conhecer a Jornada <ArrowRight className="h-5 w-5" /></a></Button>
            <Button variant="outline" size="lg" className="h-14 rounded-lg border-white/16 bg-white/6 px-8 text-base font-bold text-white hover:bg-white/12 hover:text-white" asChild><a href="#solucao" onClick={() => track("hero_cta_entender_como_funciona", "Ver como funciona", "#solucao")}>Ver como funciona</a></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/70">
            {proofItems.map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#73ead6]" />{item}</span>)}
          </div>
        </div>
      </div>
    </div>
  </section>
);
export default Hero;

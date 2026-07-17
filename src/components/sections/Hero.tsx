import { Button } from "@/components/ui/Button";
import heroMockup from "@/assets/images/hero-mockup.png";
import brandSymbol from "@/assets/images/jornada-simbolo.png";
import { trackCtaClick } from "@/services/analyticsService";
import { ArrowRight, BadgeCheck, Check, Clock3, ShieldCheck, Sparkles } from "lucide-react";

const track = (id: string, label: string, target: string) => void trackCtaClick({ cta_id: id, cta_label: label, placement: "hero", target });

const proofItems = ["14 dias grátis", "Implantação assistida", "Suporte humano"] as const;

const Hero = () => (
  <section className="relative overflow-hidden bg-[#06211f] pb-16 pt-28 text-white md:pb-20 md:pt-36">
    <div className="hero-grid absolute inset-0 opacity-35" />
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    <div className="container relative z-10">
      <div className="grid min-h-[650px] items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-4 py-2 text-sm font-bold text-[#9af4e4] shadow-2xl shadow-black/10 backdrop-blur">
            <Sparkles className="h-4 w-4" /> Plataforma de ponto para operações exigentes
          </div>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
            Controle de jornada com visual de boardroom e rotina de DP mais leve.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
            A Jornada centraliza registros, ajustes, horas extras e sinais de risco para sua equipe fechar a folha com mais clareza, menos retrabalho e uma experiência profissional desde o primeiro acesso.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="lg" className="h-14 rounded-lg px-8 text-base shadow-[0_18px_45px_rgba(17,107,96,.32)] hover:scale-100" asChild><a href="#contato" onClick={() => track("hero_cta_solicitar_demonstração", "Conhecer a Jornada", "#contato")}>Conhecer a Jornada <ArrowRight className="h-5 w-5" /></a></Button>
            <Button variant="outline" size="lg" className="h-14 rounded-lg border-white/16 bg-white/6 px-8 text-base font-bold text-white hover:bg-white/12 hover:text-white" asChild><a href="#solucao" onClick={() => track("hero_cta_entender_como_funciona", "Ver como funciona", "#solucao")}>Ver como funciona</a></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/70">
            {proofItems.map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#73ead6]" />{item}</span>)}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[680px] lg:translate-y-8">
          <div className="absolute -left-6 top-8 z-20 hidden rounded-lg border border-white/14 bg-[#0b302d]/94 px-4 py-3 shadow-2xl backdrop-blur sm:block">
            <p className="text-xs font-semibold text-white/50">Fechamento previsto</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-extrabold"><Clock3 className="h-4 w-4 text-[#f59b58]" /> 6h economizadas/mês</p>
          </div>
          <div className="absolute -right-4 top-20 z-20 hidden items-center gap-2 rounded-lg border border-white/14 bg-white px-4 py-3 text-sm font-extrabold text-[#082421] shadow-xl md:flex"><BadgeCheck className="h-5 w-5 text-[#13b997]" /> Operação em dia</div>
          <div className="relative rounded-[1.75rem] border border-white/14 bg-white/[.08] p-3 shadow-[0_34px_90px_rgba(0,0,0,.34)] backdrop-blur">
            <div className="overflow-hidden rounded-[1.15rem] bg-[#f8faf9] p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2"><span className="relative h-7 w-7 overflow-hidden rounded-md bg-[#13cfa7]"><img src={brandSymbol} alt="" className="h-full w-full scale-[2.1] object-cover" /></span><span className="text-sm font-extrabold text-[#09201e]">Jornada</span></div>
                <span className="rounded-md bg-[#e7f8f3] px-3 py-1 text-[11px] font-extrabold text-[#0c7a68]">Painel executivo</span>
              </div>
              <img src={heroMockup} alt="Painel da Jornada com visão centralizada da operação" width={1280} height={800} className="w-full rounded-lg border border-slate-100" />
            </div>
          </div>
          <div className="absolute -bottom-7 left-4 z-20 flex items-center gap-3 rounded-lg border border-white/18 bg-[#0b302d]/96 p-4 shadow-2xl backdrop-blur md:left-10"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#73ead6]/14"><ShieldCheck className="h-6 w-6 text-[#73ead6]" /></span><div><p className="text-xs text-white/55">Dados protegidos</p><p className="text-sm font-extrabold">Histórico auditável</p></div></div>
        </div>
      </div>
    </div>
  </section>
);
export default Hero;

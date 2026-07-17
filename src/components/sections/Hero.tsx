import { Button } from "@/components/ui/Button";
import heroMockup from "@/assets/images/hero-mockup.png";
import brandSymbol from "@/assets/images/jornada-simbolo.png";
import { trackCtaClick } from "@/services/analyticsService";
import { ArrowRight, BadgeCheck, Check, ShieldCheck, Sparkles } from "lucide-react";

const track = (id: string, label: string, target: string) => void trackCtaClick({ cta_id: id, cta_label: label, placement: "hero", target });

const Hero = () => (
  <section className="relative overflow-hidden bg-[#071c1b] pb-20 pt-32 text-white md:pb-28 md:pt-40">
    <div className="hero-grid absolute inset-0 opacity-30" />
    <div className="absolute -right-48 -top-48 h-[40rem] w-[40rem] rounded-full bg-[#13cfa7]/20 blur-[130px]" />
    <div className="absolute -bottom-72 -left-48 h-[36rem] w-[36rem] rounded-full bg-[#4eb3ec]/15 blur-[130px]" />
    <div className="container relative z-10">
      <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#49e3c3]/30 bg-[#49e3c3]/10 px-4 py-2 text-sm font-semibold text-[#87f1dc]"><Sparkles className="h-4 w-4" /> O ponto eletrônico evoluiu. Conheça a Jornada.</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Sua equipe no tempo certo. <span className="text-gradient-brand">Sua gestão no controle.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 md:text-xl">Uma plataforma mais robusta e segura para transformar o controle de jornada em decisões simples, folha sem surpresas e uma rotina de RH muito mais leve.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="lg" className="h-14 rounded-full px-8 text-base" asChild><a href="#contato" onClick={() => track("hero_cta_solicitar_demonstracao", "Conhecer a Jornada", "#contato")}>Conhecer a Jornada <ArrowRight className="h-5 w-5" /></a></Button>
            <Button variant="outline" size="lg" className="h-14 rounded-full border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white" asChild><a href="#solucao" onClick={() => track("hero_cta_entender_como_funciona", "Ver como funciona", "#solucao")}>Ver como funciona</a></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">{["14 dias grátis", "Implantação assistida", "Suporte humano"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#49e3c3]" />{item}</span>)}</div>
        </div>
        <div className="relative mx-auto w-full max-w-[620px]">
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-[#13cfa7]/25 to-[#4eb3ec]/15 blur-3xl" />
          <div className="relative rotate-[1deg] rounded-[2rem] border border-white/15 bg-white/[.07] p-3 shadow-2xl backdrop-blur">
            <div className="overflow-hidden rounded-[1.4rem] bg-white p-2">
              <div className="flex items-center justify-between px-3 py-2"><div className="flex items-center gap-2"><span className="relative h-7 w-7 overflow-hidden rounded-lg bg-[#13cfa7]"><img src={brandSymbol} alt="" className="h-full w-full scale-[2.1] object-cover" /></span><span className="text-sm font-extrabold text-[#09201e]">Jornada</span></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">Operação saudável</span></div>
              <img src={heroMockup} alt="Painel da Jornada com visão centralizada da operação" width={1280} height={800} className="w-full rounded-xl border border-slate-100" />
            </div>
          </div>
          <div className="absolute -bottom-8 -left-5 flex items-center gap-3 rounded-2xl border border-white/20 bg-[#0d2926]/95 p-4 shadow-2xl backdrop-blur md:-left-10"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#49e3c3]/15"><ShieldCheck className="h-6 w-6 text-[#49e3c3]" /></span><div><p className="text-xs text-white/55">Dados protegidos</p><p className="text-sm font-bold">Gestão mais segura</p></div></div>
          <div className="absolute -right-4 top-16 hidden items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2 text-sm font-bold text-[#09201e] shadow-xl sm:flex"><BadgeCheck className="h-5 w-5 text-[#13b997]" /> Tudo em dia</div>
        </div>
      </div>
    </div>
  </section>
);
export default Hero;

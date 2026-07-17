import { Button } from "@/components/ui/Button";
import brandSymbol from "@/assets/images/jornada-simbolo.png";
import { trackCtaClick } from "@/services/analyticsService";
import { ArrowUpRight } from "lucide-react";
import { useLocation } from "react-router-dom";

interface HeaderProps { hideCTA?: boolean }

const navItems = [
  { label: "Benefícios", hash: "#problemas", id: "header_nav_beneficios" },
  { label: "Recursos", hash: "#solucao", id: "header_nav_recursos" },
  { label: "Planos", hash: "#precos", id: "header_nav_precos" },
  { label: "Dúvidas", hash: "#faq", id: "header_nav_faq" },
] as const;

const Header = ({ hideCTA = false }: HeaderProps) => {
  const location = useLocation();
  const resolveTarget = (hash: string) => location.pathname === "/" ? hash : "/" + hash;
  const track = (id: string, label: string, target: string) => void trackCtaClick({ cta_id: id, cta_label: label, placement: "header", target });
  const primaryTarget = resolveTarget("#contato");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#071c1b]/88 text-white backdrop-blur-xl">
      <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-slate-900">Pular para o conteúdo</a>
      <div className="container flex h-[4.75rem] items-center justify-between gap-6">
        <a href="/" className="group flex items-center gap-3" aria-label="Página inicial da Jornada">
          <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-[#13cfa7] shadow-[0_0_30px_rgba(19,207,167,.22)]"><img src={brandSymbol} alt="" className="absolute inset-0 h-full w-full scale-[2.15] object-cover" /></span>
          <span className="text-xl font-extrabold tracking-[-0.04em]">Jornada</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex" aria-label="Navegação principal">
          {navItems.map((item) => { const target = resolveTarget(item.hash); return <a key={item.id} href={target} className="transition hover:text-[#49e3c3]" onClick={() => track(item.id, item.label, target)}>{item.label}</a>; })}
        </nav>
        {!hideCTA ? <Button variant="cta" size="sm" className="h-10 rounded-full px-5 text-sm" asChild><a href={primaryTarget} onClick={() => track("header_cta_solicitar_demonstracao", "Quero conhecer", primaryTarget)}>Quero conhecer <ArrowUpRight /></a></Button> : null}
      </div>
    </header>
  );
};
export default Header;

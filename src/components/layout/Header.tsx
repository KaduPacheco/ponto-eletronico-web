import { Button } from "@/components/ui/Button";
import brandLogo from "@/assets/images/jornada-logo-horizontal-dark.png";
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06211f]/82 text-white backdrop-blur-2xl">
      <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-slate-900">Pular para o conteúdo</a>
      <div className="container flex h-[4.75rem] items-center justify-between gap-6">
        <a href="/" className="group flex items-center" aria-label="Página inicial da Jornada">
          <img src={brandLogo} alt="Jornada" className="h-auto w-[8.8rem] object-contain" />

        </a>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex" aria-label="Navegação principal">
          {navItems.map((item) => { const target = resolveTarget(item.hash); return <a key={item.id} href={target} className="transition hover:text-[#73ead6]" onClick={() => track(item.id, item.label, target)}>{item.label}</a>; })}
        </nav>
        {!hideCTA ? <Button variant="cta" size="sm" className="h-10 rounded-lg px-5 text-sm shadow-none" asChild><a href={primaryTarget} onClick={() => track("header_cta_solicitar_demonstração", "Solicitar demonstração", primaryTarget)}>Solicitar demonstração <ArrowUpRight /></a></Button> : null}
      </div>
    </header>
  );
};
export default Header;

import brandLogo from "@/assets/images/jornada-logo-horizontal-dark.png";

const Footer = () => (
  <footer className="border-t border-white/10 bg-[#06211f] py-12 text-white">
    <div className="container">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <a href="/" className="flex items-center gap-3" aria-label="Página inicial da Jornada">
            <img src={brandLogo} alt="Jornada" className="h-auto w-[9rem] object-contain" />
          </a>
          <p className="mt-4 text-sm leading-6 text-white/60">Gestão inteligente de jornada para empresas que querem uma folha mais previsível, decisões mais rápidas e uma rotina de RH mais segura.</p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <nav className="flex flex-wrap gap-5 text-sm text-white/60" aria-label="Links institucionais">
            <a href="/politica-de-privacidade" className="transition hover:text-[#73ead6]">Política de Privacidade</a>
            <a href="/termos-de-uso" className="transition hover:text-[#73ead6]">Termos de Uso</a>
            <a href="/#contato" className="transition hover:text-[#73ead6]">Falar com especialista</a>
          </nav>
          <p className="text-sm text-white/40">(c) {new Date().getFullYear()} Jornada. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  </footer>
);
export default Footer;

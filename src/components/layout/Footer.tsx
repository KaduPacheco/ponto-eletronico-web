import brandLogo from "@/assets/images/jornada-logo-horizontal-dark.png";

const legalLinks = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/#contato", label: "Contato comercial" },
] as const;

const Footer = () => (
  <footer className="border-t border-white/10 bg-[#06211f] py-12 text-white">
    <div className="container">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-lg">
          <a href="/" className="inline-flex items-center" aria-label="Página inicial da Jornada">
            <img src={brandLogo} alt="Jornada" className="h-auto w-[12rem] object-contain md:w-[13.5rem]" />
          </a>
          <p className="mt-5 max-w-md text-sm font-medium leading-6 text-white/72">
            Gestão inteligente de jornada para empresas que querem uma folha mais previsível, decisões mais rápidas e uma rotina de RH mais segura.
          </p>
        </div>

        <div className="flex flex-col gap-5 md:items-end">
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-white/72" aria-label="Links institucionais">
            {legalLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-[#73ead6]">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="space-y-2 text-sm text-white/48 md:text-right">
            <p>Contato comercial via formulário de demonstração.</p>
            <p>(c) {new Date().getFullYear()} Jornada. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

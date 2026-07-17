import { useEffect } from "react";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trackPageView } from "@/services/analyticsService";

const TermsPage = () => {
  usePageMeta({
    title: "Termos de Uso | Jornada",
    description:
      "Consulte os termos gerais de uso da landing pública da Jornada, incluindo finalidade do conteúdo, contato comercial e uso responsável das informações.",
    path: "/termos-de-uso",
  });

  useEffect(() => {
    void trackPageView({
      page_name: "terms_of_use",
      surface: "landing",
    });
  }, []);

  return (
    <LegalPageLayout
      eyebrow="Termos"
      title="Termos de Uso"
      description="Estes termos resumem as condições de uso da landing pública, do conteúdo institucional e do formulário de contato comercial."
      lastUpdated="18 de abril de 2026"
    >
      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">1. Finalidade da landing</h2>
        <p className="leading-7 text-muted-foreground">
          A landing da Jornada apresenta informações comerciais sobre a plataforma e oferece um canal para solicitação
          de demonstração, teste e contato inicial com o time responsável pelo atendimento.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">2. Uso adequado do formulário</h2>
        <p className="leading-7 text-muted-foreground">
          Ao preencher o formulário, você declara que está enviando informações verdadeiras e que autoriza o contato comercial
          relacionado ao interesse demonstrado na plataforma. Não é permitido usar o formulário para envio automatizado,
          conteúdo malicioso ou informações de terceiros sem autorização.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">3. Conteúdo e limitações</h2>
        <p className="leading-7 text-muted-foreground">
          O conteúdo da landing tem caráter informativo e comercial. Recursos, fluxos de implantação e aderência operacional
          devem ser avaliados caso a caso durante a demonstração, conforme o cenário de cada empresa.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">4. Propriedade intelectual</h2>
        <p className="leading-7 text-muted-foreground">
          Textos, elementos visuais, identidade da marca e matériais públicados nesta landing pertencem aos seus respectivos
          titulares e não podem ser reproduzidos de forma indevida sem autorização.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">5. Atualizações</h2>
        <p className="leading-7 text-muted-foreground">
          Estes termos podem ser atualizados para refletir melhorias da operação, ajustes de comunicação ou mudanças legais e
          regulatórias aplicáveis ao uso desta página.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default TermsPage;

import { useEffect } from "react";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trackPageView } from "@/services/analyticsService";

const PrivacyPage = () => {
  usePageMeta({
    title: "Política de Privacidade | Jornada",
    description:
      "Entenda como os dados enviados na landing da Jornada são coletados, usados e protegidos durante o contato comercial e a demonstração da plataforma.",
    path: "/politica-de-privacidade",
  });

  useEffect(() => {
    void trackPageView({
      page_name: "privacy_policy",
      surface: "landing",
    });
  }, []);

  return (
    <LegalPageLayout
      eyebrow="Privacidade"
      title="Política de Privacidade"
      description="Esta página resume, em linguagem clara, como tratamos as informações enviadas pela landing para contato comercial, demonstração e atendimento inicial."
      lastUpdated="18 de abril de 2026"
    >
      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">1. Quais dados coletamos</h2>
        <p className="leading-7 text-muted-foreground">
          Quando você preenche o formulário da landing, podemos coletar nome, WhatsApp, e-mail, empresa e quantidade de
          funcionários. Também podemos registrar dados de navegação e interação, como origem do acesso e cliques em CTAs,
          para entender o desempenho da página e melhorar a experiência.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">2. Como usamos essas informações</h2>
        <p className="leading-7 text-muted-foreground">
          Usamos os dados para responder ao seu contato, organizar a solicitação comercial, preparar demonstrações, entender o
          perfil da operação interessada e acompanhar a qualidade do atendimento. Não usamos os dados para envio indiscriminado
          de mensagens promocionais.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">3. Compartilhámento e armazenamento</h2>
        <p className="leading-7 text-muted-foreground">
          Os dados podem ser armazenados em serviços contratados para captação, organização e atendimento de leads, incluindo a
          infraestrutura da aplicação e automações operacionais necessárias ao fluxo comercial. O compartilhámento ocorre apenas
          dentro do necessário para viabilizar esse atendimento.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">4. Seus direitos</h2>
        <p className="leading-7 text-muted-foreground">
          Você pode solicitar atualização, correção ou exclusão das informações enviadas, observadas as obrigações legais e o
          tempo necessário para tratamento da solicitação. Também pode pedir esclarecimentos sobre o uso dos dados compartilhados
          neste canal.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground">5. Contato</h2>
        <p className="leading-7 text-muted-foreground">
          Para assuntos relacionados à privacidade dos dados enviados pela landing, utilize o formulário disponível na página
          inicial em <a href="/#contato" className="font-medium text-primary underline-offset-4 hover:underline">Solicitar demonstração</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default PrivacyPage;

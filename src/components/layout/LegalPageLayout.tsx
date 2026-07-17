import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface LegalPageLayoutProps {
  title: string;
  eyebrow: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}

const LegalPageLayout = ({ title, eyebrow, description, lastUpdated, children }: LegalPageLayoutProps) => {
  return (
    <>
      <Header />
      <main id="conteúdo-principal" className="bg-background pt-24">
        <section className="border-b bg-muted/30 py-16">
          <div className="container max-w-4xl">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
            <p className="mt-6 text-sm text-muted-foreground">Última atualização: {lastUpdated}</p>
          </div>
        </section>

        <section className="py-16">
          <article className="container max-w-4xl space-y-10">{children}</article>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LegalPageLayout;

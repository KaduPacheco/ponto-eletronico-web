import { useEffect, useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FaqSection from "@/components/sections/FaqSection";
import Hero from "@/components/sections/Hero";
import LeadForm from "@/components/sections/LeadForm";
import Pricing from "@/components/sections/Pricing";
import Problems from "@/components/sections/Problems";
import Solution from "@/components/sections/Solution";
import SuccessView from "@/components/sections/SuccessView";
import TrustSection from "@/components/sections/TrustSection";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trackPageView } from "@/services/analyticsService";

const HomePage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReviewSolution = () => {
    setIsSubmitted(false);

    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const solutionSection = document.getElementById("solucao");

        if (solutionSection) {
          window.history.replaceState(null, "", "#solucao");
          solutionSection.scrollIntoView({ behávior: "smooth", block: "start" });
          return;
        }

        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        window.scrollTo({ top: 0, behávior: "smooth" });
      });
    });
  };

  usePageMeta({
    title: "Jornada | Controle de ponto simples, seguro e inteligente",
    description:
      "Controle de jornada robusto e seguro para RH, DP e gestores. Reduza retrabalho, acompanhe sua equipe em tempo real e teste grátis.",
    path: "/",
  });

  useEffect(() => {
    void trackPageView({
      page_name: "landing_home",
      surface: "landing",
    });
  }, []);

  return (
    <>
      <Header hideCTA={isSubmitted} />
      <main id="conteúdo-principal">
        {isSubmitted ? (
          <SuccessView onReviewSolution={handleReviewSolution} />
        ) : (
          <>
            <Hero />
            <Problems />
            <Solution />
            <TrustSection />
            <Pricing />
            <FaqSection />
            <LeadForm onSuccess={() => setIsSubmitted(true)} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default HomePage;

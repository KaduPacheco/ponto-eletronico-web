import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useToast } from "@/hooks/useToast";
import { leadSchema } from "@/lib/validations";
import {
  trackLeadFormStart,
  trackLeadFormSubmitAttempt,
  trackLeadFormSubmitError,
  trackLeadFormSubmitSuccess,
} from "@/services/analyticsService";
import { submitLeadToSupabase } from "@/services/leadService";
import { CheckCircle, CheckCircle2, Send } from "lucide-react";

const FORM_ID = "landing_lead_form";
const SECTION_ID = "contato";
const MIN_SUBMIT_DELAY_MS = 3000;

const trustPoints = [
  "Retorno comercial em até 1 dia útil",
  "Demonstração orientada ao seu cenário",
  "Teste grátis de 14 dias",
] as const;

function getSuspiciousSubmissionReason({
  botField,
  elapsedMs,
}: {
  botField: string;
  elapsedMs: number;
}) {
  if (botField) {
    return "honeypot";
  }

  if (elapsedMs < MIN_SUBMIT_DELAY_MS) {
    return "fast_submit";
  }

  return null;
}

const LeadForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    empresa: "",
    employees: "",
    bot_field: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(() => Date.now());
  const hasTrackedStartRef = useRef(false);

  const handleFormStart = () => {
    if (hasTrackedStartRef.current) {
      return;
    }

    hasTrackedStartRef.current = true;
    void trackLeadFormStart({
      form_id: FORM_ID,
      section_id: SECTION_ID,
      surface: "landing",
    });
  };

  const getElapsedMs = () => Date.now() - startTime;

  const getFilledFieldsCount = () =>
    [form.name, form.whatsapp, form.email, form.empresa, form.employees].filter((value) => value.trim().length > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const elapsedMs = getElapsedMs();

    void trackLeadFormSubmitAttempt({
      form_id: FORM_ID,
      section_id: SECTION_ID,
      elapsed_ms: elapsedMs,
      filled_fields_count: getFilledFieldsCount(),
      has_email: Boolean(form.email.trim()),
      has_company: Boolean(form.empresa.trim()),
      has_whatsapp: Boolean(form.whatsapp.trim()),
      has_employees: Boolean(form.employees.trim()),
    });

    const result = leadSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });

      setErrors(fieldErrors);

      void trackLeadFormSubmitError({
        form_id: FORM_ID,
        section_id: SECTION_ID,
        error_type: "validation",
        error_fields: Object.keys(fieldErrors),
        elapsed_ms: elapsedMs,
      });

      return;
    }

    const suspiciousReason = getSuspiciousSubmissionReason({
      botField: form.bot_field,
      elapsedMs,
    });

    if (suspiciousReason) {
      void trackLeadFormSubmitError({
        form_id: FORM_ID,
        section_id: SECTION_ID,
        error_type: "anti_spam",
        blocked_reason: suspiciousReason,
        elapsed_ms: elapsedMs,
      });

      if (suspiciousReason === "fast_submit") {
        toast({
          title: "Não foi possível concluir sua solicitação agora.",
          description: "Aguarde alguns segundos e tente novamente.",
        });
      }

      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await submitLeadToSupabase({
        nome: result.data.name,
        whatsapp: result.data.whatsapp,
        email: result.data.email || undefined,
        empresa: result.data.empresa,
        funcionarios: result.data.employees,
      });

      void trackLeadFormSubmitSuccess({
        form_id: FORM_ID,
        section_id: SECTION_ID,
        elapsed_ms: elapsedMs,
        source: "landing_page",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        setSubmitted(true);
      }

      toast({
        title: "Cadastro realizado!",
        description: "Em breve entraremos em contato com você.",
      });
    } catch (error) {
      void trackLeadFormSubmitError({
        form_id: FORM_ID,
        section_id: SECTION_ID,
        error_type: "transport",
        error_message: error instanceof Error ? error.message : "unknown_error",
        elapsed_ms: elapsedMs,
      });

      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="contato" className="bg-hero-gradient py-20">
        <div className="container text-center text-primary-foreground">
          <CheckCircle className="mx-auto mb-6 h-16 w-16 text-secondary" />
          <h2 className="mb-4 text-3xl font-extrabold">Obrigado pelo interesse.</h2>
          <p className="text-lg opacity-90">Nossa equipe deve retornar em até 1 dia útil.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="contato" className="bg-[#06211f] py-24 text-white" aria-labelledby="lead-form-title">
      <div className="container" ref={ref}>
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
            <span className="text-sm font-extrabold uppercase text-[#f59b58]" style={{ letterSpacing: ".14em" }}>Próximo passo</span>
            <h2 id="lead-form-title" className="mt-4 max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">
              Solicite uma demonstração desenhada para a sua operação.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              Preencha os dados para nosso time entender o cenário, apresentar a solução e orientar o caminho comercial com mais objetividade.
            </p>

            <div className="mt-8 grid gap-3 sm:max-w-xl">
              {trustPoints.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/7 px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#73ead6]" />
                  <p className="text-sm font-semibold leading-6 text-white/88">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            onFocusCapture={handleFormStart}
            className={`rounded-lg bg-card p-8 text-foreground shadow-[0_28px_80px_rgba(0,0,0,.24)] md:p-10 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            <input
              type="text"
              name="bot_field"
              value={form.bot_field}
              onChange={(e) => setForm({ ...form, bot_field: e.target.value })}
              className="absolute -z-10 h-0 w-0 opacity-0"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-foreground">Solicitar demonstração</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Campos essenciais para preparar um contato comercial mais útil para a sua realidade.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-2 block text-sm font-bold text-foreground">
                  Nome completo
                </label>
                <Input id="name" placeholder="Seu nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-lg" maxLength={100} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
                {errors.name && <p id="name-error" className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="whatsapp" className="mb-2 block text-sm font-bold text-foreground">WhatsApp</label>
                <Input id="whatsapp" type="tel" inputMode="tel" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="h-12 rounded-lg" maxLength={20} autoComplete="tel" aria-invalid={!!errors.whatsapp} aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined} />
                {errors.whatsapp && <p id="whatsapp-error" className="mt-1 text-xs text-destructive">{errors.whatsapp}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-foreground">E-mail corporativo</label>
                <Input id="email" type="email" placeholder="você@empresa.com.br" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-lg" maxLength={255} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
                {errors.email && <p id="email-error" className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="empresa" className="mb-2 block text-sm font-bold text-foreground">Empresa</label>
                <Input id="empresa" placeholder="Nome da empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="h-12 rounded-lg" maxLength={100} autoComplete="organization" aria-invalid={!!errors.empresa} aria-describedby={errors.empresa ? "empresa-error" : undefined} />
                {errors.empresa && <p id="empresa-error" className="mt-1 text-xs text-destructive">{errors.empresa}</p>}
              </div>

              <div>
                <label htmlFor="employees" className="mb-2 block text-sm font-bold text-foreground">Quantidade de funcionários</label>
                <Input id="employees" type="number" placeholder="Ex.: 25" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} className="h-12 rounded-lg" min="1" autoComplete="off" aria-invalid={!!errors.employees} aria-describedby={errors.employees ? "employees-error" : undefined} />
                {errors.employees && <p id="employees-error" className="mt-1 text-xs text-destructive">{errors.employees}</p>}
              </div>
            </div>

            <Button variant="cta" type="submit" className="mt-6 h-14 w-full rounded-lg text-lg shadow-none" disabled={isSubmitting || submitted}>
              <Send className={`mr-2 h-5 w-5 ${isSubmitting ? "animate-pulse" : ""}`} />
              {isSubmitting ? "Enviando..." : "Solicitar demonstração"}
            </Button>

            <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
              Ao enviar, você concorda com nossos <a href="/termos-de-uso" className="font-bold text-primary underline-offset-4 hover:underline">Termos de Uso</a> e com a <a href="/politica-de-privacidade" className="font-bold text-primary underline-offset-4 hover:underline">Política de Privacidade</a>. Seus dados serão usados apenas para contato comercial e apresentação da plataforma.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LeadForm;

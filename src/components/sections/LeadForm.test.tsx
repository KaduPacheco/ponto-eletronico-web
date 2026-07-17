import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeadForm from "./LeadForm";

const {
  submitLeadToSupabaseMock,
  toastMock,
  trackLeadFormStartMock,
  trackLeadFormSubmitAttemptMock,
  trackLeadFormSubmitErrorMock,
  trackLeadFormSubmitSuccessMock,
} = vi.hoisted(() => ({
  submitLeadToSupabaseMock: vi.fn(),
  toastMock: vi.fn(),
  trackLeadFormStartMock: vi.fn(),
  trackLeadFormSubmitAttemptMock: vi.fn(),
  trackLeadFormSubmitErrorMock: vi.fn(),
  trackLeadFormSubmitSuccessMock: vi.fn(),
}));

vi.mock("@/hooks/useScrollAnimation", () => ({
  useScrollAnimation: () => ({
    ref: { current: null },
    isVisible: true,
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/services/leadService", () => ({
  submitLeadToSupabase: submitLeadToSupabaseMock,
}));

vi.mock("@/services/analyticsService", () => ({
  trackLeadFormStart: trackLeadFormStartMock,
  trackLeadFormSubmitAttempt: trackLeadFormSubmitAttemptMock,
  trackLeadFormSubmitError: trackLeadFormSubmitErrorMock,
  trackLeadFormSubmitSuccess: trackLeadFormSubmitSuccessMock,
}));

describe("LeadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve concluir o fluxo com sucesso quando o lead for persistido", async () => {
    const onSuccess = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    let now = 1_000;

    dateNowSpy.mockImplementation(() => now);
    submitLeadToSupabaseMock.mockResolvedValue(true);

    render(<LeadForm onSuccess={onSuccess} />);
    fillValidForm();

    now = 5_000;
    fireEvent.submit(getLeadFormElement());

    await waitFor(() => {
      expect(submitLeadToSupabaseMock).toHaveBeenCalledWith({
        nome: "Maria Souza",
        whatsapp: "11999999999",
        email: "maria@empresa.com.br",
        empresa: "Empresa Exemplo",
        funcionarios: 25,
      });
    });

    expect(trackLeadFormSubmitSuccessMock).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      title: "Cadastro realizado!",
      description: "Em breve entraremos em contato com você.",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    dateNowSpy.mockRestore();
  });

  it("deve bloquear submit suspeito por honeypot sem mostrar sucesso falso", async () => {
    const onSuccess = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    let now = 1_000;

    dateNowSpy.mockImplementation(() => now);

    const { container } = render(<LeadForm onSuccess={onSuccess} />);
    fillValidForm();

    const honeypotInput = container.querySelector('input[name="bot_field"]');
    expect(honeypotInput).not.toBeNull();

    fireEvent.change(honeypotInput!, { target: { value: "bot" } });

    now = 5_000;
    fireEvent.submit(getLeadFormElement());

    await waitFor(() => {
      expect(trackLeadFormSubmitErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: "anti_spam",
          blocked_reason: "honeypot",
        }),
      );
    });

    expect(submitLeadToSupabaseMock).not.toHaveBeenCalled();
    expect(trackLeadFormSubmitSuccessMock).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    dateNowSpy.mockRestore();
  });

  it("deve bloquear submit suspeito por tempo mínimo sem avançar para sucesso", async () => {
    const onSuccess = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    let now = 1_000;

    dateNowSpy.mockImplementation(() => now);

    render(<LeadForm onSuccess={onSuccess} />);
    fillValidForm();

    now = 3_000;
    fireEvent.submit(getLeadFormElement());

    await waitFor(() => {
      expect(trackLeadFormSubmitErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: "anti_spam",
          blocked_reason: "fast_submit",
        }),
      );
    });

    expect(submitLeadToSupabaseMock).not.toHaveBeenCalled();
    expect(trackLeadFormSubmitSuccessMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      title: "Não foi possível concluir sua solicitação agora.",
      description: "Aguarde alguns segundos e tente novamente.",
    });
    expect(onSuccess).not.toHaveBeenCalled();

    dateNowSpy.mockRestore();
  });

  it("deve exibir erro e não avançar quando a persistência falhar", async () => {
    const onSuccess = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    let now = 1_000;

    dateNowSpy.mockImplementation(() => now);
    submitLeadToSupabaseMock.mockRejectedValue(new Error("Erro ao salvar lead (Status 500)"));

    render(<LeadForm onSuccess={onSuccess} />);
    fillValidForm();

    now = 5_000;
    fireEvent.submit(getLeadFormElement());

    await waitFor(() => {
      expect(trackLeadFormSubmitErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: "transport",
          error_message: "Erro ao salvar lead (Status 500)",
        }),
      );
    });

    expect(trackLeadFormSubmitSuccessMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      title: "Erro ao enviar",
      description: "Não foi possível enviar seus dados. Tente novamente.",
      variant: "destructive",
    });
    expect(onSuccess).not.toHaveBeenCalled();

    dateNowSpy.mockRestore();
  });
});

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/nome completo/i), {
    target: { value: "Maria Souza" },
  });
  fireEvent.change(screen.getByLabelText(/whatsapp/i), {
    target: { value: "11999999999" },
  });
  fireEvent.change(screen.getByLabelText(/e-mail corporativo/i), {
    target: { value: "maria@empresa.com.br" },
  });
  fireEvent.change(screen.getByLabelText(/empresa/i), {
    target: { value: "Empresa Exemplo" },
  });
  fireEvent.change(screen.getByLabelText(/quantidade de funcion/i), {
    target: { value: "25" },
  });
}

function getLeadFormElement() {
  return screen.getByRole("button", { name: /solicitar demonstra/i }).closest("form")!;
}

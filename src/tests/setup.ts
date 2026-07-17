import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global do fetch para evitar chámadas reais em testes de servico.
global.fetch = vi.fn();

// Valores públicos de teste para permitir imports de modulos que leem env
// durante a inicialização, sem depender de credenciais reais.
vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-public-key');
vi.stubEnv('VITE_SUPABASE_INTAKE_URL', 'https://demo.supabase.co/rest/v1/leads');
vi.stubEnv('VITE_N8N_WEBHOOK_URL', 'https://n8n.example.com/webhook');

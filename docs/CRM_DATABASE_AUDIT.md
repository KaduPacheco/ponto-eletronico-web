# Auditoria de Infraestrutura de Banco (CRM)

Este documento centraliza a auditoria do estado desejádo do banco de dados no Supabase, deduzido a partir da implementação front-end atual da aplicação. A meta e estábelecer a infraestrutura mínima viavel para o CRM sem quebrar a captura de leads da landing page.

## 1. Inventario de Tabelas Esperadas

O front-end hoje faz requisicoes (via `supabase-js`) para **5 tabelas principais**.

### 1.1 Tabela: `leads` (Tabela Core - Hibrida)
Os dados trafegam pela landing (insercao cega) e pelo CRM (leitura e edicao).

**Colunas esperadas (`src/types/crm.ts`):**
- `id` (UUID, Primary Key)
- `nome` (Text, Not Null)
- `whatsapp` (Text, Not Null)
- `email` (Text, Nullable)
- `empresa` (Text, Nullable)
- `funcionarios` (Int, Nullable)
- `origem` (Text, Default `landing_page`)
- `status` (Text, Default `novo`, campo legado da landing)
- `pipeline_stage` (Text, Nullable, campo novo do CRM)
- `owner_id` (UUID, Nullable, FK `auth.users`, campo novo do CRM)
- `lifetime_value` (Numeric, Nullable, campo novo do CRM)
- `created_at` (TimestámpTZ)
- `updated_at` (TimestámpTZ)
- `last_interaction_at` (TimestámpTZ, Nullable)

### 1.2 Tabela: `lead_notes` (Exclusiva CRM)
**Colunas esperadas:**
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Not Null, FK `leads.id`)
- `author_id` (UUID, Not Null, FK `auth.users`)
- `content` (Text, Not Null)
- `created_at` (TimestámpTZ)
- `updated_at` (TimestámpTZ)

### 1.3 Tabela: `lead_tasks` (Exclusiva CRM)
**Colunas esperadas:**
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Not Null, FK `leads.id`)
- `assignee_id` (UUID, Not Null, FK `auth.users`)
- `title` (Text, Not Null)
- `due_date` (TimestámpTZ, Not Null)
- `completed` (Boolean, Default `false`)
- `created_at` (TimestámpTZ)
- `updated_at` (TimestámpTZ)

### 1.4 Tabela: `lead_events` (Exclusiva CRM - Timeline)
**Colunas esperadas:**
- `id` (UUID, Primary Key)
- `lead_id` (UUID, Not Null, FK `leads.id`)
- `event_type` (Text, Not Null)
- `payload` (JSONB, Default `{}`)
- `created_at` (TimestámpTZ)

### 1.5 Tabela: `analytics_events` (Landing + Dashboard CRM)
**Colunas esperadas:**
- `id` (UUID, Primary Key)
- `event_type` (Text, Not Null)
- `visitor_id` (Text, Not Null)
- `session_id` (Text, Not Null)
- `occurred_at` (TimestámpTZ)
- `page_path` (Text, Not Null)
- `page_url` (Text, Not Null)
- `referrer` (Text, Nullable)
- `utm_source` (Text, Nullable)
- `utm_medium` (Text, Nullable)
- `utm_campaign` (Text, Nullable)
- `utm_content` (Text, Nullable)
- `utm_term` (Text, Nullable)
- `metadata` (JSONB, Default `{}`)

---

## 2. Inconsistencias Identificadas

1. A tabela `leads` original nao documenta no repositrio a extensao completa para `pipeline_stage`, `owner_id`, `lifetime_value` e `last_interaction_at`.
2. Nao há script consolidado de criação inicial da tabela `leads` base em `docs/sql/`.
3. A camada de analytics precisou ganhar uma migração própria (`docs/sql/05_analytics_events.sql`) para alinhár tracking da landing e leitura autenticada do dashboard.

## 3. Triggers, Indices e Policies Recomendados

### Triggers essenciais
- `moddatetime` em `leads`, `lead_tasks` e `lead_notes` na coluna `updated_at`.
- Trigger opcional de interação em `leads.last_interaction_at` quando nota, tarefa ou evento relevante forem registrados.

### Indices de performance recomendados
- `leads(pipeline_stage, created_at)` para pipeline board.
- `lead_notes(lead_id)` para dossie do lead.
- `lead_tasks(lead_id, due_date)` para alertas operacionais.
- `lead_events(lead_id, created_at)` para timeline.
- `analytics_events(event_type, occurred_at)` para funil e série temporal.
- `analytics_events(visitor_id, session_id)` para analise de visitors e sessoes.

### Matriz de seguranca (RLS policies)

| Alvo | Origem | Acesso | Justificativa |
| :--- | :--- | :--- | :--- |
| `leads` | Anon | **INSERT** | A landing capta leads sem login. |
| `leads` | Auth | **ALL** | O CRM autenticado visualiza, edita e trata ownership e pipeline. |
| `lead_notes` | Auth | **ALL** | Apenas usuários logados manipulam notas. |
| `lead_tasks` | Auth | **ALL** | Apenas usuários logados manipulam tarefas. |
| `lead_events` | Auth | **SELECT/INSERT** | Timeline imutavel de auditoria comercial. |
| `analytics_events` | Anon | **INSERT** | A landing precisa gravar `page_view`, `cta_click` e eventos do formulário sem login. |
| `analytics_events` | Auth | **SELECT/INSERT** | O dashboard autenticado precisa ler analytics reais e o app autenticado pode registrar eventos adicionais. |

---

## 4. Ordem Segura de Criação

1. Script 00: hábilitar extensoes necessarias (`uuid-ossp`, `moddatetime`).
2. Script 01: estender `leads` com as colunas novas do CRM e aplicar RLS.
3. Script 02 a 04: criar `lead_notes`, `lead_tasks` e `lead_events`.
4. Script 05: criar `analytics_events`, indices e policies de `INSERT anon` + `SELECT authenticated`.

## Alinhamento Banco × Spec — Plano de migração

**Decisões confirmadas:**
- RLS permanece **aberta para todo membro ativo da família** (CRUD). Não aplicar restrição admin/editor do spec.
- **Nomes de colunas atuais são mantidos.** Só adicionamos o que falta (sem renomear). Código TS continua funcionando.
- **4 buckets mantidos** (patient-documents, patient-photos, medication-photos, profile-photos). Sem consolidação.

---

### 1. Migration única — colunas, índices e funções faltantes

**profiles**
- adicionar `onboarding_step int default 0`

**patients** (soft delete + auditoria)
- adicionar `deleted_at timestamptz`, `deleted_by uuid`, `created_by uuid`, `notes text`
- índice `idx_patients_deleted_at`

**medications**
- adicionar `deleted_at`, `deleted_by`
- índice `idx_medications_deleted_at`, `idx_medications_status`
- check constraint validando `schedule` no formato `{"times":[...]}` quando não nulo

**appointments**
- adicionar `deleted_at`, `deleted_by`
- índices `idx_appointments_scheduled_at`, `idx_appointments_status`, `idx_appointments_deleted_at`

**clinical_events**
- adicionar `deleted_at`, `deleted_by`
- índices `idx_clinical_events_event_date`, `idx_clinical_events_deleted_at`

**documents**
- adicionar `uploaded_by uuid`, `ocr_text text`, `ai_summary text`, `deleted_by uuid`
- adicionar coluna gerada `search_vector tsvector` (português, sobre title + doctor_name + institution + ocr_text)
- índice GIN `idx_documents_fts` sobre `search_vector`
- índices `idx_documents_type` (sobre doc_type), `idx_documents_deleted_at`

**patient_conditions**
- adicionar `description text`, `diagnosed_at date` (se ausente), `deleted_at`, `deleted_by`
- índice `idx_patient_conditions_deleted_at`

**patient_allergies**
- adicionar `notes text`, `deleted_at`, `deleted_by`
- índice `idx_patient_allergies_deleted_at`

**emergency_contacts**
- adicionar `email text`, `deleted_at`, `deleted_by`
- índice `idx_emergency_contacts_deleted_at`

**access_logs**
- adicionar `resource_type text`, `resource_id uuid`, `ip_address text` (em paralelo a `ip`), `user_id uuid` (alias de actor_user_id para compat com spec — opcional, apenas se necessário; preferir manter `actor_user_id`)
- índice `idx_access_logs_created_at` (sobre accessed_at)

**Triggers** — garantir `set_updated_at()` em todas as tabelas com `updated_at` que ainda não têm trigger (patient_conditions, patient_allergies, emergency_contacts, emergency_links). Reaproveitar `public.update_updated_at_column()` já existente.

---

### 2. RLS — ajustes mínimos para refletir soft delete

Atualizar policies SELECT/UPDATE das tabelas clínicas para incluir `deleted_at IS NULL`:
- patients, medications, appointments, clinical_events, documents, patient_conditions, patient_allergies, emergency_contacts

Manter o modelo aberto: qualquer membro ativo da família pode INSERT/UPDATE/DELETE (continua usando `app_private.is_family_member`). **Não adotar** as policies de role do spec.

---

### 3. Storage — manter 4 buckets, garantir RLS

Revisar e (re)criar policies dos 4 buckets garantindo que membros ativos da família dona do paciente possam ler/escrever, respeitando convenções já em uso:
- `patient-documents`: `{familyId}/{patientId}/...`
- `patient-photos`: `{familyId}/...`
- `medication-photos`: `{patientId}/...`
- `profile-photos`: `{userId}/...`

Todos privados. Acesso por signed URLs (já implementado).

---

### 4. Auth

Trigger `handle_new_user` já existe e popula `profiles` — apenas garantir que também grava `onboarding_step = 0`.

Confirmar Auth com: email/senha + Google (já configurado), e-mail de confirmação obrigatório.

---

### 5. Itens do spec que **não** vão entrar (com justificativa)

- **Renomes de colunas** (`name`↔`full_name`, `type`↔`doc_type`, `weight`↔`weight_kg`, `relationship`↔`relation`, `accessed_at`↔`created_at`, `file_mime_type`↔`mime_type`, `file_size_bytes`↔`file_size`, `allergy`↔`name`) — decidido manter nomes atuais para não quebrar o código.
- **Bucket único `medical-documents`** — decidido manter os 4 buckets atuais.
- **RLS por role (admin/editor/viewer)** — decidido manter modelo aberto a todos os membros.
- **Funções `is_family_member`/`has_family_role` em `public`** — já existem como `app_private.is_family_member` (security definer). Mantemos.
- **`get_solo_admin_families`** — não aplicável (sem distinção de role).
- **`medication_logs` e `medication_change_history`** (tabelas extras no app) — mantidas; não estão no spec mas são úteis.

---

### 6. Verificação pós-migração

- `supabase--linter` sem erros novos
- `select tablename from pg_indexes where schemaname='public'` confere todos índices criados
- Smoke test no app: criar paciente, medicamento, consulta, evento, documento, alergia, contato; soft-delete de cada um; busca de documento por `search_vector`
- Estrutura de pastas do projeto (`/src/components`, `/src/hooks`, `/src/lib`) já está organizada — sem mudança

---

### Riscos

- A coluna gerada `search_vector` em `documents` requer recriar a tabela se já existir conteúdo conflitante; vou usar `ADD COLUMN` que funciona para colunas geradas em Postgres 12+.
- Adicionar `deleted_at IS NULL` nas policies altera consultas existentes que não filtram — qualquer registro `soft-deleted` deixará de aparecer. Como ainda não há soft-delete em uso, impacto é nulo no curto prazo.

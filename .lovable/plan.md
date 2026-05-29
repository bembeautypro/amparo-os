## Módulo de Medicamentos

Implementa lista, criação, edição, detalhe e histórico em `/familia/$familyId/medicamentos*`, com check de tomada, upload de foto, change history e calendário de adesão.

---

### 1. Migração de schema

**Enum `medication_status`** — adicionar valor `ended` (hoje tem `active|paused|archived`; spec usa `ended`).

**Tabela `medications`** — adicionar colunas:
- `generic_name text`
- `form text` (comprimido, cápsula, gotas, xarope, injeção, adesivo, outro)
- `start_date date default current_date`
- `end_date date`
- `prescriber text`
- `photo_path text` (caminho no bucket `medication-photos`)

**Tabela `medication_logs`** — adicionar:
- `status text not null default 'taken'` check in (`taken`,`missed`,`skipped`)
- `logged_by uuid` (auth.uid de quem marcou)
- Unique parcial `(medication_id, scheduled_for)` p/ evitar duplo-clique

**Nova tabela `medication_change_history`**
- `id`, `medication_id (fk on delete cascade)`, `field_changed text`, `old_value text`, `new_value text`, `changed_by uuid`, `changed_at timestamptz default now()`
- GRANTs p/ authenticated + service_role; RLS:
  - SELECT: `is_family_member(patient_family(medication.patient_id), auth.uid())`
  - INSERT: `is_family_admin(...)` + `changed_by = auth.uid()`
- Index `(medication_id, changed_at desc)`

**Bucket `medication-photos`** (privado) + policies: admins da família escrevem/leem (path `patientId/...`); membros leem.

---

### 2. Estrutura de arquivos

```text
src/features/medications/
  api.ts                      # queries/mutations (createServerFn não — uso direto via supabase client com RLS)
  types.ts                    # tipos Medication, MedicationLog, ChangeHistory, FORM_OPTIONS, FREQ_OPTIONS
  utils.ts                    # parseSchedule, nextDoseToday, formatTime
  MedicationsList.tsx         # abas + cards + FAB "+"
  MedicationCard.tsx          # card com check + botão ⋮
  MedicationActionsSheet.tsx  # bottom sheet Editar/Pausar/Encerrar/Histórico
  MedicationForm.tsx          # form reutilizado por novo/editar (seções)
  PhotoUploader.tsx           # input câmera/galeria + preview + upload
  ScheduleField.tsx           # N time pickers conforme frequência
  AdherenceCalendar.tsx       # grade 30 dias colorida
  ChangeHistoryTimeline.tsx
  LogsList.tsx                # últimos 10 logs
  EndMedicationDialog.tsx

src/routes/
  familia.$familyId.medicamentos.tsx           # refatorada → renderiza MedicationsList
  familia.$familyId.medicamentos.novo.tsx       # refatorada → MedicationForm (mode=create)
  familia.$familyId.medicamentos.$medId.tsx           # NOVO — detalhe
  familia.$familyId.medicamentos.$medId.editar.tsx    # NOVO — MedicationForm (mode=edit)
```

---

### 3. Tela `/medicamentos` (lista)

- `Tabs` shadcn: **Ativos | Pausados | Encerrados** (queries separadas por `status`).
- Mantém botão "+ Adicionar" no `PageHeader`.
- `MedicationCard`:
  - Nome + dosagem + frequência
  - Próximos horários do dia (renderiza chips a partir de `schedule jsonb`)
  - Badge de status (cor via tokens: `success` ativo, `warn` pausado, `muted` encerrado)
  - Botão **"✓ Marcar como tomado"** aparece para o próximo horário ainda não logado de hoje; ao clicar faz `upsert` em `medication_logs` `(medication_id, scheduled_for=hoje+HH:MM)` com `taken_at=now()`, `taken_by=auth.uid`, `status='taken'`, e invalida query do card 4 do dashboard.
  - Botão **⋮** no canto superior direito abre `MedicationActionsSheet`:
    - Editar → `/familia/$familyId/medicamentos/$medId/editar`
    - Pausar → `update status='paused'`
    - Encerrar → abre `EndMedicationDialog` (confirmação) → `status='ended'`
    - Ver histórico completo → `/familia/$familyId/medicamentos/$medId`

---

### 4. Form (novo e editar) — `/medicamentos/novo` e `/medicamentos/$medId/editar`

Formulário em **seções com separador** (heading + `<Separator/>`):

**Identificação** — Nome*, Nome genérico, Dosagem (texto livre), Forma (Select), Foto (`PhotoUploader` → bucket `medication-photos`).

**Posologia** — Frequência (Select 1x/2x/3x/4x/conforme necessário/outro). `ScheduleField` renderiza N time pickers (ou textarea livre p/ "outro", ou nada p/ "conforme necessário"). Serializado: `[{"time":"08:00"},...]` ou `null`.

**Período** — Data início (shadcn Calendar via Popover, default hoje), Data fim (opcional), Prescritor.

**Observações** — Textarea.

Submit:
- Create: `insert` em `medications`.
- Edit: faz `select` do estado antigo, monta diff campo-a-campo (incluindo `schedule` serializado e `photo_path`), executa `update` + `insert` em `medication_change_history` com `{field_changed, old_value, new_value, changed_by: auth.uid()}` para cada campo alterado.
- `toast` + invalidate + navega para `/medicamentos/$medId` (edit) ou lista (create).

---

### 5. Tela `/medicamentos/$medId` (detalhe)

- Header com nome + dosagem + botão "Editar".
- Bloco campos em modo leitura (forma, prescritor, período, observações, foto se houver — `getPublicUrl`/signed URL).
- **Histórico de tomadas — últimos 30 dias**: `AdherenceCalendar` (grid 5x6 com células coloridas):
  - verde (`success`) = `status='taken'`
  - vermelho (`emergency`) = `status='missed'`
  - cinza claro (`muted`) = sem registro ou futuro
  - sem cor / hidden = anterior ao `start_date`
- `LogsList`: últimos 10 logs com horário e nome de quem registrou. Como não há tabela `profiles` no schema, mostrar email/identificador disponível via `family_members` (join por `taken_by`) → fallback "Você"/"Outro membro". *(Nota: spec menciona `profiles.full_name` que não existe; usaremos relation/email do family_members ou só "Membro" se não disponível.)*
- **Histórico de alterações**: timeline lendo `medication_change_history`.
- Botão **"Encerrar medicamento"** vermelho ao final → `EndMedicationDialog` → `status='ended'`.

---

### 6. Notas técnicas / decisões

- Tudo client-side via `supabase` browser client (RLS já cobre admin/member). Sem `createServerFn` neste módulo (consistente com o resto do app).
- `auth.uid()` lido via `supabase.auth.getUser()` antes de inserir em `medication_logs.taken_by` e `medication_change_history.changed_by`.
- `medication_logs` upsert usa unique `(medication_id, scheduled_for)`; "Marcar como tomado" gera o registro caso não exista.
- Upload de foto: input `accept="image/*"` (Mobile: câmera/galeria nativa via prompt; sem `capture` para preservar opção de galeria); preview com `URL.createObjectURL`; path `${patientId}/${medId}/${uuid}.jpg`.
- `regeneratePatientLogsForToday()`: ao salvar/editar medicamento ativo com `schedule`, **não** pré-gera logs — eles nascem só quando marcados (mantém DB enxuto). `AdherenceCalendar` cruza com `start_date` para pintar células esperadas.
- Cores: usar tokens (`bg-primary-soft`, `bg-success`, `bg-emergency`, `bg-warn`, `bg-muted`) — nada hardcoded.
- Atualiza `src/integrations/supabase/types.ts` automaticamente após migração (Lovable).

---

### 7. Fora do escopo

- Notificações push de horário.
- Auto-geração de logs `missed` (precisaria job/cron). `AdherenceCalendar` pinta vermelho apenas se já houver log com `status='missed'` registrado.
- Edição em lote / scan de receita por IA.
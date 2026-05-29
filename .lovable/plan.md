## Objetivo

Transformar `/dashboard` na home principal que responde visualmente às 7 perguntas do usuário, com cards independentes (cada um com seu `useQuery` + skeleton), seletor de paciente sticky, FAB de ações rápidas e único botão de emergência do app.

---

## 1. Migração de schema (novo)

Tabela única + colunas faltantes para suportar o briefing 100%:

```sql
-- medications: status + schedule (horários do dia)
CREATE TYPE public.medication_status AS ENUM ('active','paused','archived');
ALTER TABLE public.medications
  ADD COLUMN status public.medication_status NOT NULL DEFAULT 'active',
  ADD COLUMN schedule jsonb;  -- ex: ["08:00","14:00","20:00"]

-- appointments: responsável (membro da família)
ALTER TABLE public.appointments
  ADD COLUMN responsible_user_id uuid;
CREATE INDEX appointments_responsible_idx ON public.appointments(responsible_user_id);

-- medication_logs: histórico de "tomado"
CREATE TABLE public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  scheduled_for timestamptz NOT NULL,   -- horário planejado do dia
  taken_at timestamptz,                 -- preenchido quando marcado como tomado
  taken_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX medication_logs_patient_day_idx
  ON public.medication_logs(patient_id, scheduled_for);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view medication logs"
  ON public.medication_logs FOR SELECT TO authenticated
  USING (app_private.is_family_member(app_private.patient_family(patient_id), auth.uid()));

CREATE POLICY "admins can manage medication logs"
  ON public.medication_logs FOR ALL TO authenticated
  USING (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()))
  WITH CHECK (app_private.is_family_admin(app_private.patient_family(patient_id), auth.uid()));
```

---

## 2. Estrutura de arquivos

```text
src/features/dashboard/
  DashboardHome.tsx           # orquestrador (seletor sticky + cards + FAB)
  PatientSwitcher.tsx         # abas sticky com foto + nome (esconde se ≤1 paciente)
  QuickActionsFab.tsx         # FAB "+" + Sheet com 4 ações
  cards/
    PatientCard.tsx           # CARD 1 — foto, idade, sangue, badges, botão Emergência
    AlertsCard.tsx            # CARD 2 — condicional, query cruzada de pendências
    AppointmentsCard.tsx      # CARD 3 — próximos 3 compromissos
    MedicationsTodayCard.tsx  # CARD 4 — meds ativas + horários + Tomado/Pendente
    DocumentsRecentCard.tsx   # CARD 5 — últimos 3 documentos
    FamilyCard.tsx            # CARD 6 — avatares dos membros ativos
    CardSkeleton.tsx          # shared skeleton
  hooks/
    useDashboardQueries.ts    # queryOptions por card (paralelo, dependentes de patientId)
src/lib/age.ts                # calcAge(birth_date) → "78 anos"
src/lib/dates.ts              # formatRelativeDateTime ("Amanhã, 14h" / "Sex 23/05, 10h")
```

Reescrita completa de `src/routes/dashboard.tsx` para usar `DashboardHome` (substituindo StatCards e seções atuais). Empty states (sem família / sem paciente) preservados do arquivo atual.

---

## 3. Comportamento por card

**Seletor de paciente (sticky)**
- Aparece somente se `patients.length > 1`.
- `position: sticky; top: <header-height>` dentro do `AppLayout`, atrás de safe-area.
- Abas horizontais com scroll (avatar 36px + primeiro nome). Estado ativo usa `primary-soft` + borda `primary`.
- Clicar chama `setActivePatient(p)` do FamilyContext (já persiste em localStorage).

**CARD 1 — Familiar ativo**
- Foto 80px (`PatientAvatarImage` resolve signed URL), nome, idade calculada de `birth_date`, tipo sanguíneo (se houver).
- Badges em linha: alergias com `severity='high'` → `bg-emergency text-emergency-foreground`; condições com `status='active'` → token `primary-soft`/`primary` (sem cores Tailwind hardcoded).
- Botão `bg-emergency` "🚨 Emergência" → `/emergencia`. ÚNICO botão de emergência (header já não tem).

**CARD 2 — Alertas (condicional)**
- Query cruzada: agrega 5 checks no cliente a partir das queries já em cache.
  1. `medications` com `status='active'` e `schedule IS NULL`.
  2. `emergency_contacts` count = 0.
  3. `appointments` futuras com `responsible_user_id IS NULL`.
  4. `patients.blood_type` ausente.
  5. `patient_allergies` count = 0.
- Só renderiza se `items.length > 0`. Fundo `bg-warn/10`, borda esquerda `border-l-4 border-warn`, ícone `AlertTriangle`. Cada linha é um `Link` para o destino de correção (medicamento → edição do med; sem contato → `/emergencia`; consulta sem responsável → detalhe da consulta; sem sangue/alergias → `/perfil` do paciente).

**CARD 3 — Próximos compromissos**
- Query: `appointments` futuros, `status NOT IN ('cancelled','done')`, ORDER ASC LIMIT 3.
- Item: ícone por `specialty` (fallback `CalendarCheck`), data relativa (`formatRelativeDateTime`), título, avatar do responsável (resolvido via `family_members` + `auth.users.email` se disponível; fallback iniciais).
- Vazio: ícone + texto + botão "Agendar" → `/familia/$familyId/agenda/novo`.

**CARD 4 — Medicamentos de hoje**
- Query: `medications` WHERE `status='active'`.
- Para cada: nome + dosagem; se `schedule IS NULL` → badge `bg-warn/15 text-warn` "Sem horário"; senão lista chips por horário do dia.
- Cruza com `medication_logs` do dia (`scheduled_for` entre `startOfDay` e `endOfDay`) — `taken_at` preenchido → chip `success`/"Tomado"; senão `muted`/"Pendente".
- Vazio: botão "Cadastrar" → `/familia/$familyId/medicamentos/novo`.

**CARD 5 — Documentos recentes**
- `documents` ORDER BY `created_at` DESC LIMIT 3. Ícone por `doc_type`, título, data (`dd/MM/yyyy`).
- Vazio: botão "Subir documento" → `/familia/$familyId/documentos/novo`.

**CARD 6 — Família**
- `family_members` WHERE `status='active'`. Avatares empilhados (máx 5, sobra → `+N`). Texto "N membros com acesso". Link "Gerenciar" → `/familia`.

---

## 4. FAB

- `QuickActionsFab` fixo, `bottom: calc(72px + env(safe-area-inset-bottom))`, `right: 16px`, z-index acima do conteúdo. Esconder no desktop (`lg:hidden`) — sidebar já oferece atalhos.
- Botão `bg-primary text-primary-foreground` `rounded-full` 56px com `Plus`.
- Click abre `Sheet` (shadcn) `side="bottom"` com 4 itens (medicamento / consulta / documento / evento clínico). "Novo evento clínico" aponta para `/familia/$familyId/documentos/novo?type=clinical_event` (placeholder — não há rota dedicada ainda).

---

## 5. Performance / loading

- Cada card declara seu próprio `queryOptions` e usa `useQuery` com `enabled: !!patientId`.
- Skeleton local (`CardSkeleton`) enquanto `isPending`. Erros isolados → mensagem inline + retry com `queryClient.invalidateQueries({ queryKey })`.
- Nada de `useSuspenseQuery` aqui (queremos shimmer por card, não fallback global). Não usar loader de rota.

---

## 6. Tokens e a11y

- Apenas tokens do design system (`primary`, `primary-soft`, `emergency`, `emergency-soft`, `warn`, `success`, `muted`, `border`). Sem `bg-red-*`/`bg-yellow-*`.
- Botão emergência com `aria-label="Acessar painel de emergência"`. FAB com `aria-label="Adicionar"`. Cada card é `<section aria-labelledby>`.
- `PatientSwitcher` é uma lista de `<button role="tab">` com `aria-selected`.

---

## 7. Não vai ser feito agora

- Notificações push / lembretes reais.
- Marcação de "Tomado" inline no card (apenas leitura — escrita continua em `/familia/$familyId/medicamentos`).
- Rota dedicada para "evento clínico" (atalho mapeia para documento por enquanto).

Confirma para eu implementar?
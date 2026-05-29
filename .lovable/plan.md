## Plano: refinar o fluxo de onboarding

O fluxo em `/onboarding` já existe (`src/features/onboarding/OnboardingFlow.tsx` + 5 steps) e cobre boa parte do spec: 5 passos lineares, barra de progresso "Passo X de 5", inserts em `families`/`family_members`/`patients`/`patient_allergies`/`patient_conditions`/`emergency_contacts`, upload em `patient-photos`, redirecionamento final pra `/dashboard`.

Vou fechar os gaps em relação ao spec sem reescrever do zero.

### Mudanças

**1. `StepWelcome.tsx` — ilustração SVG centrada**
- Remover a lista de features (HeartHandshake / ShieldCheck) e o badge "Bem-vindo".
- Adicionar SVG inline simples e centralizado combinando família + coração + escudo (paleta tokens: `var(--primary)`, `var(--primary-soft)`, `var(--surface)`).
- Manter título, subtítulo e botão "Começar organização".

**2. `OnboardingFlow.tsx` — link "Preencher depois" (passos 4 e 5)**
- Adicionar uma faixa rodapé com `Button variant="link"` "Preencher depois" no canto inferior esquerdo, visível apenas quando `step === 4 || step === 5`.
- Passo 4: pular salva nada e chama `setStep(5)`.
- Passo 5: pular vai pra `/dashboard` via `finish("/dashboard")`.
- Passos 1–3 não exibem o link (obrigatórios).

**3. `StepCritical.tsx` — separadores de seção + máscara de telefone**
- Trocar o `space-y-7` plano por 3 grupos com cabeçalhos visuais (linha + label uppercase pequeno):
  - "Para emergências" → tipo sanguíneo, alergias, condições
  - "Convênio" → nome + carteirinha
  - "Contato de emergência" (com badge "Importante") → nome + telefone
- Aplicar máscara BR no telefone (`(00) 00000-0000`) via função local de formatação no `onChange`.
- Ajustar placeholders ("Ex: Penicilina, AAS, amendoim...", "Ex: Hipertensão, Diabetes tipo 2...").

**4. `OnboardingFlow.tsx` — persistir família/paciente ativo**
- Após criar família (passo 2) e paciente (passo 3), chamar `setActiveFamilyId`/`setActivePatientId` do `FamilyContext` para que o dashboard abra já com o contexto correto (e persistido no localStorage pelo provider existente).

### Detalhes técnicos

- Nenhuma alteração no schema do banco; tabelas e RLS já cobrem todos os inserts usados.
- Nenhuma rota nova; `/onboarding` e `/dashboard` já existem.
- `setActiveFamilyId`/`setActivePatientId` já existem em `FamilyContext` (usado em outras telas) — só plugar no fluxo.
- Tokens de cor do design system "Cuida/Acolhimento" já estão em `src/styles.css`; o SVG e os separadores usarão `--primary`, `--primary-soft`, `--surface`, `--border`.
- Sem mudanças em rotas, auth, server functions ou storage.

### Arquivos tocados

- `src/features/onboarding/steps/StepWelcome.tsx` — SVG inline
- `src/features/onboarding/steps/StepCritical.tsx` — separadores + máscara
- `src/features/onboarding/OnboardingFlow.tsx` — "Preencher depois" + FamilyContext

## Revisão do Prompt 1

Verifiquei item a item o que foi implementado contra o que você pediu. Algumas coisas estão corretas, mas há **4 desvios reais** do briefing original.

### ✅ O que está correto
- Cliente Supabase configurado (`src/integrations/supabase/client.ts`)
- `AuthContext` com `useAuth()` expondo `user`, `session`, `loading`, `signIn`, `signUp`, `signOut` (+ `signInWithGoogle`)
- `ProtectedRoute` redirecionando para `/login`
- Rotas `/login` e `/register` com validação, incluindo botão Google
- Rota `/` redirecionando conforme autenticação
- Paleta, tipografia e tom seguindo o briefing
- `useFamilyContext()` mantendo família e paciente ativos

### ❌ Desvios encontrados

**1. Bottom nav e Sidebar estão com itens errados**
Você pediu: `Início | Medicamentos | Agenda | Documentos | Família` (com Perfil só pelo avatar do header).
Está hoje: `Início | Agenda | Documentos | Família | Perfil` — falta **Medicamentos** e **Perfil** está indevidamente na nav.

**2. Header tem botão de Emergência (vermelho)**
Você foi explícito: "NÃO incluir botão de emergência no header — ele fica apenas no dashboard". O `AppHeader` tem um botão `Emergência` vermelho no canto superior direito.

**3. `useFamilyContext` não persiste em localStorage**
Briefing: "persiste no localStorage para sobreviver a reloads". Hoje, `activeFamily` e `activePatient` vivem só em `useState` — ao recarregar, voltam para o primeiro da lista.

**4. Stack: React Router DOM vs TanStack Router**
O briefing pediu `React Router DOM`, mas o template Lovable é fixado em **TanStack Router** (file-based routing em `src/routes/`). Trocar a stack quebraria todo o app. Recomendo manter TanStack Router e tratar isso como adaptação obrigatória da plataforma — **não vou trocar**, apenas registro.

### Observações menores (não bloqueantes)
- Rota `/familia/:familyId/*` existe como rotas planas (`familia.$familyId.medicamentos.tsx` etc.) — correto no padrão TanStack.
- Rotas públicas `/emergencia/:token` e `/convite/:token` ainda não existem (mas o briefing disse "implementar depois", então OK).

---

## Plano de correção

Mudanças apenas em frontend/contexto, sem mexer em backend nem em módulos.

### 1. Corrigir itens da navegação
Arquivo: `src/components/layout/BottomNav.tsx` e `src/components/layout/AppSidebar.tsx`

- Substituir array de items pelos 5 corretos: `Início`, `Medicamentos`, `Agenda`, `Documentos`, `Família`.
- `Medicamentos` aponta para `/familia/$familyId/medicamentos` usando o `activeFamily.id` do `useFamilyContext` (fallback desabilitado se não houver família).
- No `AppSidebar` (desktop), adicionar um link separado para `/perfil` abaixo dos 5 principais, conforme o briefing ("mesmos 5 itens + link para Perfil").
- No `BottomNav` (mobile), remover `Perfil` — acesso via avatar do header.

### 2. Remover botão de Emergência do header
Arquivo: `src/components/layout/AppHeader.tsx`

- Remover o `<Button asChild>` com `<Link to="/emergencia">` e o ícone `PhoneCall`.
- Manter avatar do usuário e seletor de paciente.
- Garantir que o Dashboard (`src/routes/dashboard.tsx`) ainda exponha o atalho de emergência (já existe lá, então nada a adicionar — só validar).

### 3. Persistir família/paciente ativos em localStorage
Arquivo: `src/contexts/FamilyContext.tsx`

- Ao inicializar `activeFamily` / `activePatient`, hidratar a partir de `localStorage` (`amparo:active-family-id`, `amparo:active-patient-id`).
- Quando as queries de `families`/`patients` carregarem, escolher o ativo na ordem: ID salvo no localStorage (se ainda existir na lista) → primeiro item da lista → null.
- Em `setActiveFamily` / `setActivePatient`, gravar o ID no localStorage (ou remover quando null).
- Trocar de família deve limpar o paciente salvo se ele não pertencer mais à família ativa.

### 4. Sem mudanças de banco, sem mudanças de auth, sem mexer em outras rotas.

Posso aplicar essas correções na sequência assim que você aprovar.
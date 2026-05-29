# Plano — Polimentos finais do Amparo

Aplicar os 8 pontos em ordem de dependência. Onde a especificação diverge do que o projeto já tem, sigo a convenção do projeto (TanStack Start, paleta teal Cuida/Acolhimento) e sinalizo abaixo.

## Notas de contexto importantes

- **Não existe `index.html`.** Este projeto é TanStack Start — `<title>`, manifest, meta de PWA e theme-color vivem em `src/routes/__root.tsx` dentro de `head()` e `RootShell`. Aplico tudo lá.
- **Theme-color:** a spec sugere `#2563eb` (azul). A identidade do Amparo é teal `#01373d` (primary). Vou usar `#01373d` no `theme_color` do manifest e nos ícones para manter coerência de marca — confirme se prefere o azul mesmo assim.
- **Sonner já está instalado e o `<Toaster />` já está montado** no root. Só preciso criar o helper de retry e padronizar uso.
- **EmptyState já existe** em `src/components/ui-extras.tsx` — vou estendê-lo para aceitar uma ilustração SVG opcional além do ícone.

---

## 1. Empty states acolhedores

- Estender `EmptyState` com prop `illustration?: ReactNode` (SVG inline). Manter ícone como fallback.
- Criar `src/components/illustrations/` com 4 SVGs simples (~120×120, traços leves em `currentColor` para herdar o teal): `PillsEmpty`, `CalendarEmpty`, `DocsEmpty`, `HistoryEmpty`.
- Atualizar copy + CTA em cada lista:
  - Medicamentos → "Nenhum medicamento cadastrado ainda." / "Cadastrar primeiro"
  - Agenda → "Nenhuma consulta agendada." / "Agendar consulta"
  - Documentos → "Sua biblioteca está vazia. Suba o primeiro documento." / "Subir agora"
  - Histórico → "Nenhum evento clínico registrado." / "Registrar primeiro evento"
- Texto em `text-muted-foreground` (token semântico que já corresponde ao cinza acolhedor — não usar `text-gray-600` hardcoded).

## 2. Feedback de ações (sonner + retry)

- Criar `src/lib/toast.ts` com helpers:
  - `toastSuccess(msg)` → `toast.success(msg, { duration: 3000 })`
  - `toastError(err, retry?: () => void)` → `toast.error(msg, { duration: 5000, action: retry ? { label: "Tentar novamente", onClick: retry } : undefined })`
- Padronizar nas mutations existentes: `onError: (e) => toastError(e, () => mutation.mutate(vars))`. Aplicar em medicamentos, agenda, documentos, histórico, membros, perfil, paciente.
- Criar componente `<LoadingButton>` (wrapper sobre `Button`) que aceita `loading` e troca o conteúdo por `<Loader2 className="animate-spin" />` + mantém largura. Substituir nos formulários de criação/edição.

## 3. Confirmações destrutivas padronizadas

- Criar `src/components/ConfirmDeleteDialog.tsx` reutilizável (sobre `AlertDialog` do shadcn):
  - Props: `open`, `onOpenChange`, `itemName`, `description?`, `onConfirm`, `loading`.
  - Título: `Excluir {itemName}?` · Descrição: "Esta ação não pode ser desfeita."
  - Confirmar: `variant="destructive"` "Sim, excluir" · Cancelar: "Voltar".
- Substituir os modais ad-hoc em: deletar documento, remover membro da família, encerrar medicamento (status → discontinued), cancelar consulta (status → cancelled), remover alergia/condição/contato no perfil do paciente.

## 4. Offline banner

- Criar hook `src/hooks/useOnlineStatus.ts` que retorna `online` baseado em `navigator.onLine` + listeners `online`/`offline`.
- Criar `src/components/OfflineBanner.tsx`: barra fixa abaixo do `AppHeader` (amarela, usando token `--warn-soft` + `text-warn`), copy: "Sem conexão — exibindo dados salvos. Alterações serão sincronizadas ao reconectar."
- Montar dentro de `AppLayout`, logo após o header.
- Ao voltar online: `queryClient.invalidateQueries()` (refetch global) + dismiss automático.

## 5. Responsividade

- Auditoria visual nos 4 breakpoints (375/390/768/1280) das telas principais: dashboard, listas (med/agenda/docs/histórico), perfil do paciente, perfil do usuário, central de emergência.
- Correções comuns esperadas: `overflow-x-hidden` em containers de listas com badges longos, `flex-wrap` em headers com várias ações, `truncate` em nomes longos.
- Nada estrutural — só ajustes localizados onde quebrar.

## 6. Acessibilidade básica

- Varredura em `Button size="icon"` sem `aria-label` (header, sidebar, ações em cards, setas de reordenação, fechar modais) — adicionar labels descritivos em PT-BR.
- Garantir `htmlFor`/`id` em todos os pares `Label`/`Input` (usar `useId` em formulários repetidos).
- Garantir `min-h-11 min-w-11` nos botões icônicos primários (já é o caso da maioria dos `Button` default; ajustar onde for `size="icon"` em ações primárias).
- Verificar que não há texto em `text-muted-foreground/50` ou tons hardcoded de cinza claro.

## 7. Página de Perfil do Usuário (`/perfil`)

- **Migração:** adicionar coluna `phone text` em `public.profiles` (e regenerar tipos).
- Refatorar `src/routes/perfil.tsx` para:
  - Foto: upload em bucket existente (avatars) ou criar bucket `profile-photos` se não houver — vou usar `patient-photos` não, vou criar `profile-photos` com policy `auth.uid() = (folder)[1]`. Atualiza `profiles.avatar_url` com o path.
  - Campos editáveis inline: `full_name`, `phone`. Email read-only via `user.email`.
  - Botão "Sair" → `AlertDialog` simples → `signOut()` → `/login`.
  - Botão "Excluir minha conta" (destructive):
    1. Query: buscar todas famílias onde sou admin e contar quantos outros admins ativos têm. Helper `checkSoleAdminFamilies(userId)`.
    2. Se for único admin de pelo menos uma família → bloqueio: card de aviso com nome da(s) família(s) + botão "Gerenciar família" para `/familia/$id/membros`. Não renderizar botão de excluir.
    3. Caso contrário → dupla confirmação:
       - Modal 1: "Tem certeza? Todos os seus dados serão removidos."
       - Modal 2: input "digite seu email para confirmar" → habilita botão final.
    4. Executar via server function `deleteMyAccount` (`createServerFn` + `requireSupabaseAuth` + `supabaseAdmin.auth.admin.deleteUser(userId)`). Cascata cuida do resto (FKs já estão `ON DELETE CASCADE`).
    5. Após sucesso: `signOut()` + redirect `/login`.

## 8. PWA básico (apenas manifest — sem service worker)

> Seguindo a recomendação do template: instalabilidade sem service worker para não quebrar o preview do editor.

- Criar `public/manifest.json` com os campos da spec (mas `theme_color: "#01373d"` para casar com a marca — confirme se prefere o azul `#2563eb`).
- Gerar `public/icons/icon-192.png` e `public/icons/icon-512.png` (fundo teal `#01373d`, letra "A" branca centralizada, fonte Plus Jakarta semibold). Uso ferramenta de geração de imagem em modo premium para garantir tipografia limpa.
- No `__root.tsx` adicionar em `head()`:
  - `<link rel="manifest" href="/manifest.json">` (via `links`)
  - `<meta name="theme-color" content="#01373d">` (substituir o `#ffffff` atual)
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- Atualizar `<title>` + `description` para o copy da spec.
- **Não** instalar `vite-plugin-pwa` nem criar service worker.

---

## Ordem de execução

1. Migração `profiles.phone` + bucket `profile-photos` (precisa aprovação).
2. Infra compartilhada: `toast.ts`, `LoadingButton`, `ConfirmDeleteDialog`, `useOnlineStatus`, `OfflineBanner`, ilustrações SVG, extensão do `EmptyState`.
3. Montar `OfflineBanner` no `AppLayout` e atualizar empty states de cada módulo.
4. Substituir confirmações destrutivas + padronizar toasts/retry em todas as mutations.
5. Reescrever `/perfil` (upload, edição, sair, fluxo de exclusão).
6. Server function `deleteMyAccount`.
7. PWA: manifest + ícones + meta tags.
8. Passada final de a11y (`aria-label`, contraste, `htmlFor`) e responsividade (375/390/768/1280).

## Confirmar antes de executar

- Theme color: **teal `#01373d`** (sugestão, casa com a marca) **ou azul `#2563eb`** (literal da spec)?

## Plano — Migrar Design System para "Cuida / Acolhimento"

O Handoff define um sistema completamente diferente do que está hoje: paleta **creme + teal escuro + alert tijolo** (warm), tipografia **Plus Jakarta Sans**, raios mais arredondados (card = 22px, pill = 999), spacing em grid de 8pt e tipografia tokenizada (display → eyebrow). Hoje o app usa azul-600 + cinzas + Inter — vai ser uma troca visual grande, mas estrutural e reaproveitável porque mantemos os nomes semânticos do Tailwind/shadcn (`--primary`, `--background`, `--card`, etc.).

### Escopo
- Apenas tokens, fonte e ajustes mínimos em componentes de layout que referenciam cores específicas.
- Sem mexer em rotas, lógica, schema, auth ou conteúdo das telas.
- Sem dark mode nesta passada (o Handoff só especifica um tema).

### 1. Fonte: Plus Jakarta Sans
- `bun add @fontsource-variable/plus-jakarta-sans`
- Importar no topo de `src/styles.css` (`@import "@fontsource-variable/plus-jakarta-sans"`).
- Definir `font-family` base em `html, body` no `@layer base`.

### 2. Reescrever `:root` em `src/styles.css` com os tokens do Handoff

Cores (convertidas para oklch dentro do `:root`, conforme regra do template):

| Token shadcn          | Handoff source                | Valor                |
|-----------------------|-------------------------------|----------------------|
| `--background`        | `--c-bg` creme claro          | `#fffaf2`            |
| `--foreground`        | `--c-text` near-black quente  | `#262525`            |
| `--card`              | branco                        | `#ffffff`            |
| `--popover`           | branco                        | `#ffffff`            |
| `--primary`           | `--c-accent` teal escuro      | `#01373D`            |
| `--primary-foreground`| `--c-accent-fg` creme         | `#FEF3E1`            |
| `--primary-soft`      | `--c-accent-soft`             | `#D4E8E6`            |
| `--secondary`         | `--c-surface` linho           | `#FEF3E1`            |
| `--secondary-foreground` | text                       | `#262525`            |
| `--muted`             | surface                       | `#FEF3E1`            |
| `--muted-foreground`  | text-soft                     | `rgba(38,37,37,.68)` |
| `--accent`            | accent-soft (hover sutil)     | `#D4E8E6`            |
| `--accent-foreground` | accent                        | `#01373D`            |
| `--border`            | line                          | `rgba(38,37,37,.10)` |
| `--input`             | line                          | `rgba(38,37,37,.10)` |
| `--ring`              | accent                        | `#01373D`            |
| `--sidebar`           | text (sidebar escura)         | `#262525`            |
| `--sidebar-foreground`| accent-fg                     | `#FEF3E1`            |
| `--sidebar-accent`    | rgba(254,243,225,.12)         | (translúcido sobre escuro) |
| `--sidebar-border`    | rgba(254,243,225,.08)         |                      |
| `--destructive` / `--emergency` | `--c-alert` tijolo  | `#AA3C26`            |
| `--emergency-soft`    | `--c-alert-soft`              | `#FCE0D5`            |

Tokens novos (adicionar ao `@theme inline` para virarem classes Tailwind):
- `--color-success: #236444` + `--color-success-soft: #DAEBDE`
- `--color-warn: #B46E1E` + `--color-warn-soft: #FDE9C8`

Raios — substituir o sistema atual por:
- `--radius: 1.375rem` (22px = card padrão)
- Manter aliases shadcn `--radius-sm/md/lg/xl/2xl` ajustando o `calc()` para bater com 10/14/19/22/28.

Spacing/typography — adicionar como CSS variables livres (`--s-1` … `--s-9`, `--fs-display`…`--fs-xs`) para uso pontual; **não** sobrescrevemos a escala do Tailwind para evitar regressão em todo o app.

### 3. Sidebar dark (mudança visual notável)

O Handoff define a sidebar com fundo `--c-text` (quase preto quente) e textos creme. Como o app já consome `--sidebar` / `--sidebar-foreground`, basta trocar os valores desses tokens — `src/components/layout/AppSidebar.tsx` continua igual.

Único ajuste no componente: o logo hoje usa `bg-primary text-primary-foreground` (vira teal sobre creme), o que fica bom; e os itens ativos usam `bg-primary-soft text-primary`. Com sidebar dark, esses tokens precisam de override local: trocar por `data-[active]:bg-white/10 data-[active]:text-[color:var(--sidebar-foreground)]` ou similar. Vou ajustar dentro do próprio componente sem criar tokens extras.

### 4. Header e bottom-nav

- `AppHeader` permanece em `bg-background/85` (creme) — fica coerente.
- `BottomNav` continua em `bg-card/95` (branco) — coerente.
- Estados ativos hoje usam `text-primary` (= teal). Nada a mudar no JSX.

### 5. Botões / cartões — herdam automaticamente

Componentes shadcn (`Button`, `Card`, `Badge`, `Input`, `Dialog`, etc.) consomem os tokens semânticos. Trocando o `:root`, eles ganham a nova paleta sem edit. Spot-check visual depois para garantir contraste em variantes (`outline`, `ghost`, `secondary`).

### 6. Pontos que vou validar após a troca

- Telas `/login` e `/register`: o `AuthShell` provavelmente usa cores específicas — vou checar e ajustar se preciso.
- `/dashboard`, `/emergencia`, onboarding: garantir que badges e CTAs de severidade usem `--emergency` (crítico), e que possamos introduzir `--color-warn` / `--color-success` onde hoje há `text-red-500` / `text-green-600` hardcoded (se houver).
- Procurar e remover qualquer classe Tailwind de cor hardcoded (`bg-blue-*`, `text-red-*`, `bg-gray-*`) em componentes do app, substituindo por tokens semânticos.

### 7. Memória do projeto

Após aplicar, registro em `mem://index.md` (Core) as decisões de paleta/tipografia para que mudanças futuras não voltem ao azul/Inter.

---

### Arquivos que vou tocar
- `src/styles.css` — reescrita do `:root`, `@theme inline` (novos tokens) e `@layer base` (font-family).
- `package.json` (via `bun add`) — fonte Plus Jakarta Sans.
- `src/components/layout/AppSidebar.tsx` — ajuste mínimo nas classes do item ativo para combinar com sidebar dark.
- Eventuais ajustes pontuais em componentes com cor hardcoded encontrada na varredura.
- `mem://index.md` — registrar paleta + fonte como regras Core.

Sem mudanças em backend, rotas, contextos ou módulos. Pode aprovar?
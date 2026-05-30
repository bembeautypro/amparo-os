## Diagnóstico inicial

A auditoria encontrou que o backend está ativo, o linter não apontou problemas, as tabelas principais estão com RLS ligado, os buckets existem e as permissões gerais de Data API estão disponíveis para usuários autenticados. O problema mais provável agora está na combinação de estado de família/familiar ativo, navegação e alguns fluxos de UI que usam o familiar errado ou navegam de forma inválida.

Principais causas identificadas:

1. **Onboarding navega para rotas parametrizadas usando URL interpolada**
   - O botão “Adicionar medicamento / documento / consulta” no final do onboarding monta strings como `/familia/<id>/medicamentos/novo` e chama `navigate({ to: target })`.
   - Em TanStack Router, isso pode cair em rota inválida e mandar o usuário para `/dashboard`, que explica o comportamento de “saiu da tela e foi pra início”.

2. **Ações em cards de familiares não selecionam o familiar antes de abrir cadastro**
   - Na página Família, os botões “Consulta” e “Documento” dentro do card de cada familiar navegam para a rota, mas não chamam `setActivePatient(p)`.
   - Resultado: o cadastro abre para o familiar anteriormente ativo, ou parece que “não dá para escolher entre um e outro”.

3. **Rotas de documentos/agenda/medicamentos/histórico dependem só de `activePatient` global**
   - Se o contexto ainda está carregando, ou se o familiar ativo não pertence à família da URL, a página mostra “Selecione um familiar” ou lista dados errados/vazios.
   - Isso afeta documentos e outras páginas que parecem “não funcionais”.

4. **Algumas rotas/listas ainda não tratam `FamilyContext.loading`**
   - As rotas novas já melhoraram parcialmente, mas páginas de listagem como documentos, agenda, medicamentos e histórico ainda podem renderizar fallback cedo demais.

5. **Documento: fluxo depende de upload antes do registro**
   - O upload usa o caminho correto `{familyId}/{patientId}/{arquivo}` para o bucket `patient-documents`.
   - Vou manter esse padrão e reforçar mensagens de erro e invalidação de cache para deixar falhas visíveis.

6. **Remoção de familiar/membro precisa separar dois conceitos**
   - “Familiar/paciente” é o paciente cuidado.
   - “Membro” é usuário logado com acesso à família.
   - A tela de membros remove usuários da família; a tela de família hoje não oferece remover o familiar/paciente. Vou corrigir o fluxo que estiver quebrado e deixar claro na interface.

## Plano de correção

### 1. Corrigir navegação do onboarding
- Alterar `StepFirstAction` para retornar uma ação estruturada, não uma URL interpolada.
- Alterar `OnboardingFlow.finish()` para navegar com rotas tipadas:
  - `/familia/$familyId/medicamentos/novo`
  - `/familia/$familyId/documentos/novo`
  - `/familia/$familyId/agenda/novo`
  - `/dashboard`
- Garantir que `activeFamily` e `activePatient` sejam definidos antes da navegação final.

### 2. Sincronizar familiar ativo com a rota/família correta
- Criar um pequeno helper/componente reutilizável para resolver o familiar ativo da família atual:
  - enquanto `FamilyContext` carrega, mostrar loading;
  - se o familiar ativo não pertence ao `familyId` da rota, selecionar o primeiro familiar daquela família;
  - se não houver familiar, mostrar CTA para adicionar familiar.
- Aplicar isso em:
  - medicamentos
  - agenda/consultas
  - documentos
  - histórico/exames/eventos

### 3. Corrigir seleção de familiar em ações rápidas
- Na página Família, ao clicar em “Medicamentos”, “Consulta” ou “Documento” dentro do card de um familiar, chamar `setActivePatient(p)` antes de navegar.
- Garantir o mesmo comportamento nos atalhos do dashboard, se houver ação baseada em familiar ativo.
- Manter o seletor do header funcionando, mas não depender só dele.

### 4. Corrigir páginas de listagem que parecem vazias/quebradas
- Atualizar as rotas de listagem para respeitar `loading`:
  - `/familia/$familyId/documentos`
  - `/familia/$familyId/agenda`
  - `/familia/$familyId/medicamentos`
  - `/familia/$familyId/historico`
- Substituir fallback prematuro “Selecione um familiar” por estado de carregamento e CTA correto.
- Garantir que a listagem consulta sempre o `patientId` resolvido da família da rota.

### 5. Revisar cadastro de medicamento, consulta e exame/evento
- Validar os fluxos de criação:
  - medicamento em `MedicationForm`
  - consulta em `AppointmentForm`
  - exame/evento em `ClinicalEventForm`
  - documento em `DocumentNewForm`
- Corrigir navegações inválidas como `navigate({ to: ".." as never })` para rotas absolutas tipadas.
- Melhorar mensagens de erro dos formulários para expor erro real de permissão/upload quando ocorrer.
- Invalidar também as queries do dashboard/contadores após criação.

### 6. Ajustar remoção/gestão de familiares e membros
- Para **membros da família**: manter qualquer membro ativo podendo remover outro membro, conforme regra definida.
- Para **familiares/pacientes**: adicionar ou corrigir ação de excluir familiar/paciente na tela de família/perfil do paciente, respeitando a política “qualquer membro logado da família pode inserir, deletar ou visualizar”.
- Após excluir, atualizar cache e selecionar automaticamente outro familiar disponível.

### 7. Backend: confirmar e endurecer policies/buckets sem abrir dados
- Confirmar em migration que:
  - usuários autenticados membros da família podem criar/editar/deletar pacientes, medicamentos, consultas, documentos, exames/eventos, alergias, condições e contatos de emergência;
  - buckets privados continuam privados;
  - `patient-documents` aceita `{familyId}/{patientId}/...`;
  - `patient-photos` aceita `{familyId}/...`;
  - `medication-photos` aceita `{patientId}/...`;
  - `profile-photos` continua pessoal.
- Remover ou ajustar policies duplicadas/antigas se houver conflito, sem conceder acesso público indevido.
- Manter acesso anônimo apenas onde faz sentido: convite por token e link de emergência ativo.

### 8. Validação final
- Testar os fluxos principais no preview:
  - selecionar familiar A/B;
  - criar medicamento para cada familiar;
  - criar consulta;
  - criar exame/evento;
  - subir documento/foto;
  - deletar familiar/paciente;
  - remover membro da família;
  - finalizar onboarding escolhendo medicamento/documento/consulta.
- Checar logs/requisições para confirmar ausência de erros de RLS, storage e navegação.
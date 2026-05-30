## Diagnóstico

A varredura encontrou que a infraestrutura está saudável e o linter do backend não aponta falhas estruturais, mas há divergências reais entre a regra desejada e o que está implementado.

**O que está causando os erros:**

1. **As policies ainda tratam `admin` como obrigatório para gravar dados**
   - Medicamentos, documentos, exames/eventos clínicos, agenda, pacientes, alergias, condições, contatos de emergência, logs de medicamentos e alguns anexos só permitem criar/editar/deletar se o usuário for `admin` da família.
   - Isso contradiz sua regra: qualquer usuário logado que pertence à família deve poder inserir, deletar e visualizar.

2. **Aceitar convite/adicionar segundo membro da família pode falhar**
   - A tela de convite tenta inserir o usuário convidado em `family_members`.
   - A policy atual de `family_members` só permite inserir se quem está fazendo a ação já for admin ou criador da família.
   - Para o convidado, isso bloqueia a entrada porque ele ainda não é membro/admin no momento do aceite.

3. **Bucket `patient-documents` está com regra incompatível com o código**
   - O código envia documentos no caminho:
     ```text
     {familyId}/{patientId}/{uuid}.{ext}
     ```
   - A policy atual do bucket interpreta a primeira pasta como se fosse `patientId`.
   - Resultado provável: upload de documentos, exames e anexos falha antes mesmo de salvar a linha na tabela.

4. **Buckets de fotos/anexos ainda exigem admin para escrita**
   - `patient-photos`, `patient-documents` e `medication-photos` permitem leitura por membros, mas escrita/alteração/exclusão ainda está restrita a admin em vários pontos.

5. **“Adicionar familiar” reaproveita o onboarding e cria nova família**
   - No header e em alguns empty states, o botão “Adicionar familiar” manda para `/onboarding`.
   - O onboarding sempre cria uma nova família + primeiro paciente.
   - Isso explica famílias duplicadas com 1 paciente cada e a sensação de que só foi possível adicionar o “Pai”.

6. **A UI também esconde ações por `isAdmin`**
   - Mesmo após corrigir policies, algumas telas continuariam escondendo convite, atividade e ações de membros de usuários que não são admin.

---

## Plano de correção

### 1. Corrigir as policies do banco para “membro ativo da família”

Criar uma migration que substitui as regras `admin` por regras baseadas em `app_private.is_family_member(...)`.

**Tabelas de dados do paciente/família:**
- `patients`
- `patient_allergies`
- `patient_conditions`
- `emergency_contacts`
- `appointments`
- `clinical_events`
- `documents`
- `medications`
- `medication_logs`
- `emergency_links`

Nova regra: qualquer usuário autenticado que seja membro ativo da família do paciente pode visualizar, criar, editar e deletar esses registros.

**Históricos e logs:**
- `access_logs`: qualquer membro ativo pode registrar e visualizar atividade da família.
- `medication_change_history`: membros podem visualizar e inserir histórico; manter sem edição/exclusão para preservar auditoria.

**Família, membros e convites:**
- `families`: membros ativos podem visualizar e editar dados da família; criação continua exigindo `created_by = auth.uid()`.
- `family_members`: membros ativos podem visualizar e gerenciar membros conforme a regra solicitada.
- Adicionar uma policy específica para o convidado aceitar convite: o usuário autenticado poderá inserir a própria associação quando existir convite pendente para seu email.
- `invitations`: membros ativos podem criar, visualizar, reenviar/cancelar convites; o convidado continua podendo aceitar somente convite pendente do próprio email.

### 2. Corrigir policies dos buckets privados

Manter buckets privados, mas alinhar as regras com o fluxo real do app.

**`patient-documents`**
- Usar o caminho atual do código como padrão:
  ```text
  {familyId}/{patientId}/{arquivo}
  ```
- Validar que:
  - o usuário é membro ativo de `{familyId}`;
  - `{patientId}` pertence a `{familyId}`.
- Permitir leitura, upload, atualização e exclusão para membros ativos da família.

**`medication-photos`**
- Manter caminho atual:
  ```text
  {patientId}/{arquivo}
  ```
- Trocar escrita/edição/exclusão de admin para membro ativo da família do paciente.

**`patient-photos`**
- Manter caminho atual baseado em `{familyId}`.
- Trocar escrita/edição/exclusão de admin para membro ativo da família.

**`profile-photos`**
- Manter como está: cada usuário só gerencia a própria foto de perfil.

### 3. Endurecer GRANTs públicos sem quebrar convites/emergência

Hoje as permissões SQL de `anon` aparecem amplas, mas RLS bloqueia quase tudo. Vou deixar isso mais explícito e seguro:

- Remover permissões anônimas desnecessárias das tabelas privadas.
- Manter leitura anônima apenas onde existe fluxo público legítimo:
  - convite por token;
  - link de emergência ativo.
- Confirmar que `authenticated` continua com permissões necessárias e RLS faz o filtro por família.

### 4. Criar fluxo correto para adicionar novo familiar/paciente

Criar uma tela dedicada:

```text
/familia/$familyId/pacientes/novo
```

Essa tela vai:
- adicionar um novo paciente/familiar na família já existente;
- reutilizar o mesmo padrão visual do passo de paciente do onboarding;
- permitir foto do familiar;
- gravar em `patients` com `family_id` correto;
- atualizar o familiar ativo no `FamilyContext`;
- voltar para `/familia` ou para o perfil do familiar recém-criado.

### 5. Ajustar links que hoje mandam para onboarding indevidamente

Trocar links de “Adicionar familiar” para a nova rota quando já existir família ativa:

- menu do header;
- página Família;
- dashboard/empty state quando a família já existe mas ainda não tem paciente;
- qualquer outro CTA que esteja usando `/onboarding` para adicionar paciente em família existente.

O `/onboarding` fica reservado só para o primeiro uso: criar família + primeiro familiar.

### 6. Corrigir o comportamento do onboarding ao escolher “Adicionar medicamento”

Depois do onboarding, garantir que a navegação para medicamento/documento/agenda use a família e paciente recém-criados sem depender de estado ainda não hidratado.

Ajustes previstos:
- manter `activeFamily` e `activePatient` persistidos;
- deixar as rotas de novo medicamento/documento/agenda exibirem estado de carregamento enquanto o `FamilyContext` reidrata;
- se não houver paciente ativo depois do carregamento, mostrar CTA claro para adicionar familiar em vez de voltar silenciosamente ao início.

### 7. Remover bloqueios visuais baseados em admin onde conflitam com a nova regra

Atualizar telas de família/membros para a regra nova:

- convite de pessoas disponível para qualquer membro ativo;
- lista de atividade visível para qualquer membro ativo;
- ações de membro alinhadas com as policies novas.

Os papéis podem continuar aparecendo como informação, mas não devem bloquear CRUD familiar se a regra do produto agora é “qualquer membro pode”.

### 8. Verificação final

Após implementar, validar:

- todas as tabelas públicas continuam com RLS ativo;
- policies novas não dependem mais de admin para CRUD familiar;
- buckets privados aceitam upload/leitura pelos membros certos;
- convite aceita segundo membro corretamente;
- adicionar novo familiar não cria família duplicada;
- membro não-admin consegue cadastrar:
  - medicamento;
  - foto da caixa do remédio;
  - documento;
  - exame;
  - consulta/evento;
  - anexo em consulta/evento;
- linter do backend continua sem alertas críticos.

Não vou alterar o design system.
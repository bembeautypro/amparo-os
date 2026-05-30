## Tornar a foto do medicamento visível em toda a jornada

### Diagnóstico
- **Upload:** ✅ funciona. `PhotoUploader` envia para o bucket privado `medication-photos` no path `{patientId}/{uuid}.{ext}` e grava o caminho em `medications.photo_url`.
- **Exibição:** ❌ ausente. A foto só aparece como preview dentro do próprio formulário. Nem o card da lista (`MedicationCard`), nem a tela de detalhe, nem o histórico mostram a imagem. Resultado: o usuário tira a foto, salva, e nunca mais vê.
- **Sem OCR.** O usuário esclareceu que não precisa de OCR — só quer ver a foto que tirou.

### O que vou fazer

```text
1. Criar componente reutilizável <MedicationPhoto path size />
   - Gera signed URL (1h) com cache via TanStack Query
     (queryKey: ["med-photo", path], staleTime: 55min)
   - Renderiza <img> redondo/quadrado com fallback de ícone
     (Pill) quando path é null
   - Skeleton enquanto carrega a signed URL

2. MedicationCard (lista /medicamentos):
   - Adicionar thumbnail 56x56 à esquerda do nome
   - Mantém o nome, dosagem e horários ao lado

3. Tela de detalhe do medicamento:
   - Banner com a foto em tamanho maior (h-40, object-cover)
   - Clique abre lightbox simples (Dialog do shadcn) em tamanho cheio

4. Refatorar PhotoUploader para também usar o novo
   componente no preview (evita duplicação da lógica de
   signed URL e bate o mesmo cache)
```

### Detalhes técnicos
- Bucket `medication-photos` já é privado com RLS por `family_id` (membros ativos podem ler) — apenas o caminho de signed URL muda na UI, **sem mexer em RLS nem migração**.
- Cache compartilhado por `path` evita gerar signed URL N vezes na lista.
- Sem mudança de design system, paleta, ou tokens.
- Sem mudança de schema.

### Fora de escopo (não vou fazer)
- OCR / extração de texto da caixa.
- Upload múltiplo de fotos por medicamento.
- Crop/edição da imagem.

Aprove para eu entrar em build mode e implementar.

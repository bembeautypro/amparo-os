## Veredito sobre o esquema proposto (uploads `20260526000001/02`)

**Não vale a pena migrar.** O banco atual já é equivalente em performance e segurança ao proposto:

- **RLS sem recursão:** ambos usam funções `SECURITY DEFINER` (`app_private.is_family_admin`, `is_family_member`, `patient_family`) para evitar recursão de policy. Idêntico em comportamento.
- **Índices e FKs:** o esquema atual cobre `patient_id`, `family_id`, `medication_id`, `appointment_id`, `clinical_event_id` — mesmas joins críticas. Sem regressão.
- **Diferenças são só de nomenclatura:** enums em inglês no proposto vs. mistos português/inglês no atual (`appointment_type` = `consulta/exame/retorno` etc.); `family_member_role` vs. `family_role`; bucket `documents` vs. `patient-documents`; `severity_level` vs. `allergy_severity`.
- **Custo de migrar:** recasting de **todos** os enums + reescrita de todo o código TS/SQL que os referencia + regeneração de `src/integrations/supabase/types.ts` + migração física de arquivos do storage. Risco de quebrar 100% das telas, **zero ganho de performance**.

**Decisão:** manter o esquema atual. Padronizar apenas a convenção de **path do storage** (item 7 do plano), que dá benefício real (segurança via RLS por `family_id` na primeira pasta) sem renomear buckets.

---

## Plano de execução (aprovado)

```text
1. Remover src/routes/emergencia.tsx (rota órfã fora da spec)
2. AlertsCard → corrigir os 5 destinos para rotas do paciente / edição
3. Edge function log-emergency-access:
     - adicionar preferred_hospital ao SELECT do paciente
     - gerar signed URL (3600s) para photo_url e incluir no payload
4. Página pública /emergencia/:token:
     - renderizar foto real quando a URL chegar
     - adicionar SEÇÃO 7 "Hospital de preferência"
5. ClinicalEventDetail: canEdit = role === 'admin' || role === 'editor'
6. MedicationForm/PhotoUploader: dois botões no mobile (Câmera + Galeria)
7. AppointmentForm e ClinicalEventForm: trocar upload manual pelo helper
   uploadDocumentFile() para padronizar path {familyId}/{patientId}/{uuid}.{ext}
8. Smoke test final
```

Nenhuma migration de banco. Nenhum token de design alterado.

**Aprove para eu entrar em build mode e executar.**

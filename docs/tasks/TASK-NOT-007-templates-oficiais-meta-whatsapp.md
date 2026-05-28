# TASK-NOT-007 - Templates oficiais Meta WhatsApp

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-05-05
- source-of-truth: docs/tasks/TASK-NOT-007-templates-oficiais-meta-whatsapp.md

## Objetivo unico
Criar os templates oficiais da Meta WhatsApp Cloud API, em `pt_BR`, categoria `Utility`, para que o SyLembra envie notificacoes reais de vencimento de licenca.

## Entrega MVP
- Quatro templates oficiais de licenca foram criados no WhatsApp Manager e estao em analise na Meta.
- Os nomes finais foram documentados em `/doc`.
- Seed demo foi alinhada para usar os nomes oficiais.
- UI passou a permitir regra exclusiva para RT, desmarcando `Notificar profissional`.
- Templates de documento e botao `Enviar documento` ficaram explicitamente fora do MVP e documentados como backlog bloqueado por backend.

## Artefatos gerados em `/doc`
- `docs/archive/sylembra/doc/meta-whatsapp-templates/README.md`
- `docs/archive/sylembra/doc/meta-whatsapp-templates/templates-licencas-prontos-meta.md`
- `docs/archive/sylembra/doc/meta-whatsapp-templates/templates-documentos-e-botoes-bloqueados.md`

Use `templates-licencas-prontos-meta.md` como documento principal para copiar os campos na tela da Meta.

## Contexto operacional
- Envio real via backend ja foi validado com template de teste.
- Phone Number ID real removido do registro versionado; configurar apenas via ambiente privado.
- `.env` local deve apontar `META_WHATSAPP_PHONE_NUMBER_ID` para o numero real sem versionar o valor.
- `META_WHATSAPP_TOKEN` permanece privado e nao deve ser exposto em docs, logs ou commits.
- Provider Meta ja envia variaveis de corpo via `components[].parameters`.
- O backend extrai a ordem das variaveis a partir do `NotificationTemplate.bodyPreview`.

## Variaveis que o backend ja monta hoje para jobs de licenca
Origem: `services/api/src/core/notifications/notifications.service.ts`.

- `professionalName`
- `licenseTypeName`
- `licenseNumber`
- `issuer`
- `uf`
- `issuedAt`
- `expiresAt`
- `daysUntilExpiration`
- `daysExpired`
- `responsibleRtName`
- `responsibleRtPhoneMasked`
- `willEscalateToRt`
- `recipientKind`

## Regra tecnica importante
O `NotificationJob` usa um unico `templateKey`. Quando uma regra esta com `notifyProfessional=true` e `notifyRt=true`, os dois destinatarios usam o mesmo template.

Para usar texto diferente para profissional e RT, criar duas regras com o mesmo gatilho:
- regra do profissional: `notifyProfessional=true`, `notifyRt=false`, `templateKey=license_expiration_notice` ou `license_expired_notice`;
- regra do RT: `notifyProfessional=false`, `notifyRt=true`, `templateKey=responsible_license_expiration_notice` ou `responsible_license_expired_notice`.

Observacao: a UI agora permite desmarcar `Notificar profissional`, viabilizando regra exclusiva para RT/responsavel.

## Botoes nos templates
E possivel criar templates Meta com botoes, mas o backend atual ainda nao envia componentes de botao. Hoje ele envia apenas:
- corpo do template;
- variaveis do corpo em `components[type=body].parameters`.

Botao `Enviar documento` fica bloqueado para o MVP atual porque precisa de um link unico por profissional/licenca, preferencialmente gerado por `UploadToken`.

Menor ajuste necessario para liberar:
1. Criar/reutilizar `UploadToken` ao montar o job de notificacao da licenca.
2. Incluir `uploadUrl` no `payloadJson`.
3. Ensinar `MetaWhatsAppProvider` a enviar componente de botao URL, por exemplo `components[type=button, sub_type=url, index=0].parameters`.
4. Criar template Meta com botao do tipo URL dinamica.

Enquanto isso nao estiver pronto, os templates oficiais abaixo devem ser criados sem botoes.

Referencia operacional detalhada: `docs/archive/sylembra/doc/meta-whatsapp-templates/templates-documentos-e-botoes-bloqueados.md`.

## Templates oficiais criados na Meta
Detalhes completos, corpos finais, cabecalhos, exemplos e `bodyPreview` estao em:

- `docs/archive/sylembra/doc/meta-whatsapp-templates/templates-licencas-prontos-meta.md`

Templates do MVP:
- `license_expiration_notice`
- `responsible_license_expiration_notice`
- `license_expired_notice`
- `responsible_license_expired_notice`

## Templates bloqueados ate ajuste pequeno no backend

### 5. `responsible_document_uploaded_notice`
- Categoria: `Utility`
- Idioma: `pt_BR`
- Evento desejado: responsavel/RT quando documento for enviado.
- Corpo proposto:

```text
Olá {{1}}, a profissional {{2}} enviou um documento para a licença {{3}} número {{4}}. O documento aguarda validação.
```

- Variaveis desejadas:
  1. `responsibleRtName`
  2. `professionalName`
  3. `licenseTypeName`
  4. `licenseNumber`
- Status: bloqueado.
- Motivo: `uploadDocumentWithToken` e `uploadDocument` criam `Document` e auditoria, mas nao criam `NotificationJob`.
- Menor ajuste necessario:
  - apos upload publico/autenticado, buscar `professional.responsibleRt`, `license.licenseType` e criar job WhatsApp para o RT quando houver telefone.

### 6. `document_approved_notice`
- Categoria: `Utility`
- Idioma: `pt_BR`
- Evento desejado: profissional quando documento for aprovado.
- Corpo proposto:

```text
Olá {{1}}, o documento da licença {{2}} número {{3}} foi aprovado.
```

- Variaveis desejadas:
  1. `professionalName`
  2. `licenseTypeName`
  3. `licenseNumber`
- Status: bloqueado.
- Motivo: `validateDocument` atualiza documento, recalcula licenca e audita, mas nao cria `NotificationJob` para o profissional.
- Menor ajuste necessario:
  - quando `input.status === "APPROVED"`, criar job WhatsApp para `document.professional.phone`.

### 7. `document_rejected_notice`
- Categoria: `Utility`
- Idioma: `pt_BR`
- Evento desejado: profissional quando documento for recusado.
- Corpo proposto:

```text
Olá {{1}}, o documento da licença {{2}} número {{3}} foi recusado. Motivo: {{4}}.
```

- Variaveis desejadas:
  1. `professionalName`
  2. `licenseTypeName`
  3. `licenseNumber`
  4. `rejectionReason`
- Status: bloqueado.
- Motivo: `validateDocument` possui `rejectionReason`, mas nao cria `NotificationJob` para o profissional.
- Menor ajuste necessario:
  - quando `input.status === "REJECTED"`, criar job WhatsApp para `document.professional.phone` com `rejectionReason`.

## Env e configuracoes
- `.env`:
  - `META_WHATSAPP_PHONE_NUMBER_ID=<preencher-no-ambiente-privado>`
  - `META_WHATSAPP_TOKEN`: manter privado.
  - `META_WHATSAPP_SMOKE_TEMPLATE`: manter `hello_world` ou outro template sem variaveis para smoke simples; nao usar templates com variaveis no smoke atual.
  - `META_WHATSAPP_SMOKE_TEMPLATE_LANGUAGE`: manter idioma correspondente ao template de smoke.
- Templates oficiais ficam no banco, via tela Configuracoes ou API:
  - `key`
  - `metaTemplateName`
  - `language`
  - `bodyPreview`
- Regras de disparo ficam em `NotificationRule`:
  - `daysBeforeExpiration` para licenca a vencer.
  - `repeatAfterExpiredDays` para licenca vencida.
  - `notifyProfessional`
  - `notifyRt`

## Passo a passo executado no WhatsApp Manager
1. Acessado WhatsApp Manager do numero SyLembra.
2. Criados quatro modelos de mensagem.
3. Categoria usada: `Utility`.
4. Idioma usado: `Portuguese (BR)` / `pt_BR`.
5. Nomes exatamente como listados neste documento.
6. Corpos e exemplos preenchidos conforme `docs/archive/sylembra/doc/meta-whatsapp-templates/templates-licencas-prontos-meta.md`.
7. Modelos enviados para analise da Meta.

## Validacao esperada apos aprovacao
1. Rodar seed ou cadastrar os quatro templates internos no SyLembra.
2. Criar regras de vencimento:
   - profissional a vencer: `license_expiration_notice`;
   - RT a vencer: `responsible_license_expiration_notice`;
   - profissional vencida: `license_expired_notice`;
   - RT vencida: `responsible_license_expired_notice`.
3. Rodar scanner dry-run e conferir payload.
4. Processar jobs.
5. Confirmar resposta Meta com `messages[0].id`.

## Riscos
- Templates com texto diferente do `bodyPreview` podem receber variaveis fora de ordem.
- Template de RT separado exige regra separada e uso correto dos checkboxes `Notificar profissional` e `Notificar RT`.
- Templates de documento ainda nao tem geracao de jobs no backend.
- `META_WHATSAPP_SMOKE_TEMPLATE` nao deve apontar para template com variaveis enquanto o smoke script nao aceitar parametros.

## Proximo passo recomendado
1. Aguardar aprovacao dos quatro templates pela Meta.
2. Rodar seed/cadastro interno para persistir `NotificationTemplate` e regras oficiais.
3. Fazer envio real com um profissional e um RT de teste.
4. Implementar jobs de documentos em uma task seguinte, se virar prioridade.

# Templates de Documentos e Botoes - Bloqueados por Backend

Estes templates sao bons candidatos, mas ainda nao devem ser criados como fluxo oficial ate o backend gerar jobs de documento e, no caso de botao, enviar componente de botao.

## Botao "Enviar documento"

### Status
Bloqueado.

### Por que
O backend atual nao coloca `uploadUrl` no `payloadJson` do job e o provider Meta ainda nao envia `components[type=button]`.

### Menor ajuste necessario
1. Criar ou reutilizar `UploadToken` ao montar o job de aviso de licenca.
2. Incluir `uploadUrl` no payload.
3. Enviar componente de botao URL dinamica no `MetaWhatsAppProvider`.
4. Criar template Meta com botao URL.

### Template futuro sugerido
Nome:
```text
license_expiration_upload_notice
```

Corpo:
```text
Olá {{1}}, sua licença {{2}} número {{3}} vence em {{4}}. Para enviar o documento, use o botão abaixo.
```

Botao:
```text
Enviar documento
```

URL base futura:
```text
https://app.sylembra.com/public-upload/{{1}}
```

## responsible_document_uploaded_notice

### Status
Bloqueado.

### Nome futuro
```text
responsible_document_uploaded_notice
```

### Corpo futuro
```text
Olá {{1}}, a profissional {{2}} enviou um documento para a licença {{3}} número {{4}}. O documento aguarda validação.
```

### Variaveis desejadas
1. `responsibleRtName`
2. `professionalName`
3. `licenseTypeName`
4. `licenseNumber`

### Menor ajuste necessario
Apos `uploadDocumentWithToken` e `uploadDocument`, criar `NotificationJob` para o RT quando houver telefone.

## document_approved_notice

### Status
Bloqueado.

### Nome futuro
```text
document_approved_notice
```

### Corpo futuro
```text
Olá {{1}}, o documento da licença {{2}} número {{3}} foi aprovado.
```

### Variaveis desejadas
1. `professionalName`
2. `licenseTypeName`
3. `licenseNumber`

### Menor ajuste necessario
Quando `validateDocument` aprovar documento, criar `NotificationJob` para o profissional quando houver telefone.

## document_rejected_notice

### Status
Bloqueado.

### Nome futuro
```text
document_rejected_notice
```

### Corpo futuro
```text
Olá {{1}}, o documento da licença {{2}} número {{3}} foi recusado. Motivo: {{4}}.
```

### Variaveis desejadas
1. `professionalName`
2. `licenseTypeName`
3. `licenseNumber`
4. `rejectionReason`

### Menor ajuste necessario
Quando `validateDocument` recusar documento, criar `NotificationJob` para o profissional com `rejectionReason`.

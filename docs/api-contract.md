# API Contract — Landpager Admin Mobile

Este documento descreve os contratos de API e payload FCM que o backend Next.js e o app mobile utilizam para integração de push notifications.

---

## 1. `POST /api/settings/push-token`

Registra ou atualiza o FCM device token do usuário autenticado no backend.

### Request

```http
POST /api/settings/push-token
Content-Type: application/json
Cookie: auth-token=<jwt>
```

```json
{
  "token": "fcm_device_token_string",
  "deviceType": "android"
}
```

| Campo        | Tipo   | Obrigatório | Descrição                          |
|--------------|--------|-------------|-------------------------------------|
| `token`      | string | ✅           | Token FCM retornado pelo Firebase   |
| `deviceType` | string | ✅           | Plataforma: `"android"` ou `"ios"` |

### Response

**200 OK** — Token registrado com sucesso.

```json
{ "success": true }
```

**401 Unauthorized** — Sessão inválida ou cookie ausente.

```json
{ "error": "Unauthorized" }
```

### Observações de Implementação

- O app envia o token na inicialização e em cada refresh via `onTokenRefresh`.
- Cache local (`AsyncStorage`) previne reenvio redundante na mesma sessão — a chave de cache é `push_token_registered_<token>`.
- No primeiro login, o `auth-token` é injetado explicitamente no header `Cookie` para mitigar race condition do CookieManager nativo.

---

## 2. Payload FCM — Notificação de Alerta

O backend despacha notificações via FCM usando o payload `data` (não `notification`), garantindo entrega mesmo com app em background/killed e controle total da exibição pelo app.

### Payload FCM enviado pelo backend (Data-Only Message)

```json
{
  "to": "<fcm_device_token>",
  "data": {
    "type": "FORM_SUBMISSION",
    "title": "Novo Lead Cadastrado!",
    "message": "Você tem um novo contato vindo da página inicial.",
    "dynamicFields": "[{\"label\":\"Nome\",\"value\":\"João Silva\"},{\"label\":\"E-mail\",\"value\":\"joao@exemplo.com\"},{\"label\":\"Telefone\",\"value\":\"(11) 99999-9999\"}]"
  },
  "android": {
    "priority": "high"
  }
}
```

> **Nota:** `dynamicFields` é um JSON **stringificado** porque todos os valores do `data` FCM devem ser strings.

### Campos do Payload `data`

| Campo           | Tipo            | Obrigatório | Descrição                                                                 |
|-----------------|-----------------|-------------|---------------------------------------------------------------------------|
| `type`          | string          | ✅           | Tipo do evento. Ex: `"PURCHASE_ALERT"`, `"SYSTEM_ALERT"`                 |
| `title`         | string          | ✅           | Título da notificação exibida ao usuário                                  |
| `message`       | string          | ✅           | Corpo/descrição da notificação                                            |
| `dynamicFields` | string (JSON)   | ❌           | Array de `{ label: string, value: string }` serializado como JSON string. Ideal para repassar detalhes de formulários recebidos (ex: Nome, E-mail, Respostas do form). |

### Modelo `dynamicFields` (desserializado)

```typescript
type DynamicField = {
  label: string;
  value: string;
};

// Exemplo
const dynamicFields: DynamicField[] = [
  { label: "Cliente", value: "João Silva" },
  { label: "Produto", value: "Plano Premium" },
  { label: "Valor",   value: "R$ 99,00" },
];
```

---

## 3. Modelo de Notificação Persistida (AsyncStorage)

O app persiste notificações recebidas localmente, com limite de 50 itens (FIFO — mais antigas descartadas).

```typescript
interface StoredNotification {
  id: string;          // messageId do FCM ou timestamp ISO como fallback
  receivedAt: string;  // ISO 8601 — ex: "2026-09-13T10:00:00.000Z"
  type: string;        // ex: "PURCHASE_ALERT"
  title: string;
  message: string;
  dynamicFields: Array<{ label: string; value: string }>;
  read: boolean;       // false por padrão; true após usuário abrir o card
}
```

**AsyncStorage Key:** `@notifications_store`

---

## 4. Canal Android FCM — Alta Prioridade

Para que notificações apareçam como **heads-up** (banner sobreposto) sem o usuário precisar puxar a barra de status, o app usa um canal Android com `IMPORTANCE_HIGH`.

### Canal configurado no app

| Propriedade   | Valor                    |
|---------------|--------------------------|
| ID do canal   | `high_priority_channel_v2`  |
| Nome          | `Alertas de Alta Prioridade` |
| Importância   | `IMPORTANCE_HIGH` (4)    |
| Som           | Customizado (`coin_8bit.wav`)      |
| Vibração      | Habilitada               |

### Configuração no `AndroidManifest.xml`

```xml
<meta-data
  android:name="com.google.firebase.messaging.default_notification_channel_id"
  android:value="high_priority_channel_v2" />
```

> **⚠️ Som Customizado & Data-Only:** Como utilizamos um som customizado ("moedinha 8-bit"), o backend **deve** enviar apenas mensagens de dados (`data-only`). Se o backend incluir a chave `notification`, o sistema Android tentará exibir o push sozinho, potencialmente ignorando as configurações do Notifee e pulando o salvamento local do app em background. Ao enviar apenas `data`, o app intercepta via `setBackgroundMessageHandler`, salva no AsyncStorage e exibe com a biblioteca Notifee garantindo que o som de moeda de 8-bit seja sempre tocado.

---

## 5. Fluxo de Integração — Webhook Mercado Pago → FCM

```
Mercado Pago Webhook (POST /api/webhooks/mercadopago)
  └─▶ Backend Next.js valida assinatura
        └─▶ Busca FCM token do usuário no banco
              └─▶ Monta payload FCM com dynamicFields
                    └─▶ POST para FCM API (Firebase Admin SDK)
                          └─▶ App mobile recebe e persiste no AsyncStorage
```

Para referência da arquitetura visual, consulte: [`res/fcm-architecture.mermaid`](../res/fcm-architecture.mermaid)

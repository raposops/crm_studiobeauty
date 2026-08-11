# WhatsApp Webhook - Supabase Edge Function

Esta Edge Function recebe notificações HTTP POST de webhooks da API do WhatsApp (ex: Evolution API, Z-API, Baileys, Meta Cloud API) para atualizar automaticamente em tempo real o status dos agendamentos no seu banco de dados Supabase.

---

## 🚀 Como Fazer o Deploy no Supabase CLI

No terminal do seu projeto, execute o seguinte comando:

```bash
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
```

> **Nota:** A flag `--no-verify-jwt` é necessária para permitir que a API do WhatsApp (Z-API/Evolution) consiga enviar requisições POST sem precisar de um token JWT de usuário logado.

---

## 🔗 URL do Webhook

Após o deploy, a URL do seu webhook será:

```
https://<SEU_PROJETO_SUPABASE>.supabase.co/functions/v1/whatsapp-webhook
```

---

## 🧪 Exemplo de Payload Testado (JSON enviado pelo WhatsApp)

### 1. Confirmação (Resposta "1" ou "Sim"):
```json
{
  "phone": "5551991603139",
  "messageText": "1"
}
```

**Resposta HTTP 200:**
```json
{
  "success": true,
  "status": "confirmado",
  "agendamento_id": "faf9e24d-2c66-44f3-8971-3291bbe77f59",
  "cliente": "Aline Neves",
  "message": "Agendamento marcado como confirmado com sucesso."
}
```

### 2. Cancelamento (Resposta "2" ou "Cancelar"):
```json
{
  "phone": "5551991603139",
  "messageText": "2"
}
```

**Resposta HTTP 200:**
```json
{
  "success": true,
  "status": "cancelado",
  "agendamento_id": "faf9e24d-2c66-44f3-8971-3291bbe77f59",
  "cliente": "Aline Neves",
  "message": "Agendamento marcado como cancelado com sucesso."
}
```

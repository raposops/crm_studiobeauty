# Integration: Evolution API + Supabase Edge Functions

Esta documentação descreve o fluxo completo de envio automático de mensagens e confirmação de agendamentos via WhatsApp utilizando a **Evolution API** e as **Supabase Edge Functions**.

---

## 🔁 Fluxo Completo de Funcionamento

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant CRM as Studio Beauty CRM
  participant EF_Send as Edge Function (send-whatsapp)
  participant Evo as Evolution API
  participant EF_Web as Edge Function (whatsapp-webhook)
  participant DB as Supabase PostgreSQL

  CRM->>EF_Send: Novo agendamento cadastrado
  EF_Send->>Evo: POST /message/sendText (Enviar resumo + opção 1/2)
  Evo->>Cliente: Mensagem no WhatsApp: "Responda 1 para Confirmar ou 2 para Cancelar"
  Cliente->>Evo: Responde "1" (ou "Sim") no WhatsApp
  Evo->>EF_Web: Webhook Event (POST /functions/v1/whatsapp-webhook)
  EF_Web->>DB: UPDATE agendamentos SET status = 'confirmado'
  DB-->>CRM: Realtime Update: O card atualiza automaticamente para VERDE!
```

---

## 🛠️ Step 1: Configurar as Variáveis no Supabase (Secrets)

No terminal do seu projeto, defina as credenciais da sua instância da **Evolution API**:

```bash
npx supabase secrets set EVOLUTION_API_URL="https://sua-evolution-api.com"
npx supabase secrets set EVOLUTION_API_KEY="SUA_API_KEY_AQUI"
npx supabase secrets set EVOLUTION_INSTANCE_NAME="sua_instancia"
```

---

## 🚀 Step 2: Fazer Deploy das Edge Functions

Execute os comandos abaixo para publicar as duas funções no Supabase:

### 1. Função de Envio de Mensagens:
```bash
npx supabase functions deploy send-whatsapp --no-verify-jwt
```

### 2. Função de Webhook (Recebe a resposta 1 ou 2 do cliente):
```bash
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
```

---

## ⚙️ Step 3: Configurar o Webhook no Painel da Evolution API

No painel administrativo da **Evolution API** ou via chamada de API, configure a URL do webhook para escutar mensagens recebidas:

- **Webhook URL:** `https://<SEU_PROJETO_SUPABASE>.supabase.co/functions/v1/whatsapp-webhook`
- **Events:** `MESSAGES_UPSERT` (ou mensagens recebidas)
- **Enabled:** `true`

---

## ✅ Pronto!

Agora, sempre que um novo agendamento for registrado:
1. A cliente receberá a mensagem no WhatsApp.
2. Ao responder **1** (ou "sim"), o status mudará automaticamente para **`confirmado`** no CRM.
3. Ao responder **2** (ou "cancelar"), o status mudará para **`cancelado`**.

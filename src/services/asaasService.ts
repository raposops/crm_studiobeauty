/**
 * Service de Integração com a API Asaas v3 (Sandbox & Produção)
 */

export interface AsaasCustomerInput {
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  externalReference?: string;
}

export interface AsaasSubscriptionInput {
  customerId: string;
  value: number;
  nextDueDate?: string;
  cycle?: 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  billingType?: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  externalReference?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue?: number;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  description?: string;
  billingType: string;
  externalReference?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // Base64 da imagem do QR Code
  payload: string;      // Código Copia e Cola PIX
  expirationDate: string;
}

class AsaasService {
  private get baseUrl(): string {
    if (process.env.ASAAS_API_URL) {
      return process.env.ASAAS_API_URL.replace(/\/$/, '');
    }
    const env = (process.env.ASAAS_ENVIRONMENT || '').toLowerCase();
    if (env === 'production' || env === 'producao') {
      return 'https://api.asaas.com/v3';
    }
    return 'https://sandbox.asaas.com/api/v3';
  }

  private get apiKey(): string {
    return (
      process.env.ASAAS_API_KEY ||
      process.env.NEXT_PUBLIC_ASAAS_API_KEY ||
      ''
    ).trim().replace(/^["']|["']$/g, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      ...(options.headers as Record<string, string> || {}),
    };

    if (!this.apiKey) {
      console.warn('[AsaasService] Chave ASAAS_API_KEY não configurada no ambiente.');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.errors?.[0]?.description || data?.message || `Erro na requisição Asaas: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  /**
   * Cria ou busca um cliente no Asaas
   */
  async criarOuBuscarCliente(input: AsaasCustomerInput): Promise<AsaasCustomer> {
    try {
      // 1. Tenta buscar por externalReference (salao_id) ou e-mail
      let existingCustomer: AsaasCustomer | null = null;

      if (input.externalReference) {
        const list = await this.request<{ data: AsaasCustomer[] }>(
          `/customers?externalReference=${encodeURIComponent(input.externalReference)}`
        );
        if (list.data && list.data.length > 0) {
          existingCustomer = list.data[0];
        }
      }

      if (!existingCustomer && input.email) {
        const listEmail = await this.request<{ data: AsaasCustomer[] }>(
          `/customers?email=${encodeURIComponent(input.email)}`
        );
        if (listEmail.data && listEmail.data.length > 0) {
          existingCustomer = listEmail.data[0];
        }
      }

      if (existingCustomer) {
        // Se o cliente existente não tem CPF e agora foi informado, atualiza
        if (input.cpfCnpj && !existingCustomer.cpfCnpj) {
          const updated = await this.request<AsaasCustomer>(`/customers/${existingCustomer.id}`, {
            method: 'POST',
            body: JSON.stringify({
              cpfCnpj: input.cpfCnpj.replace(/\D/g, ''),
              mobilePhone: input.mobilePhone || input.phone || undefined,
            }),
          });
          return updated;
        }
        return existingCustomer;
      }

      // 2. Se não encontrar, cria novo cliente
      const newCustomer = await this.request<AsaasCustomer>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          phone: input.phone || undefined,
          mobilePhone: input.mobilePhone || input.phone || undefined,
          cpfCnpj: input.cpfCnpj ? input.cpfCnpj.replace(/\D/g, '') : undefined,
          externalReference: input.externalReference || undefined,
          notificationDisabled: false,
        }),
      });

      return newCustomer;
    } catch (err: any) {
      console.error('[AsaasService] Erro em criarOuBuscarCliente:', err);
      throw err;
    }
  }

  /**
   * Cria uma assinatura recorrente mensal para o salão
   */
  async criarAssinatura(input: AsaasSubscriptionInput): Promise<{ id: string; [key: string]: any }> {
    const today = new Date();
    // Vencimento padrão: hoje + 3 dias ou especificado
    const defaultDueDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const body = {
      customer: input.customerId,
      billingType: input.billingType || 'UNDEFINED',
      value: input.value,
      nextDueDate: input.nextDueDate || defaultDueDate,
      cycle: input.cycle || 'MONTHLY',
      description: input.description || 'Assinatura Mensal - CRM Studio Beauty',
      externalReference: input.externalReference || undefined,
    };

    return this.request<{ id: string }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Cria uma cobrança avulsa (ou fatura imediata)
   */
  async criarCobrancaAvulsa(input: {
    customerId: string;
    value: number;
    dueDate?: string;
    description?: string;
    externalReference?: string;
    billingType?: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  }): Promise<AsaasPayment> {
    const today = new Date();
    const dueDate = input.dueDate || new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.request<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: input.customerId,
        billingType: input.billingType || 'PIX',
        value: input.value,
        dueDate,
        description: input.description || 'Mensalidade Plano PRO - CRM Studio Beauty',
        externalReference: input.externalReference || undefined,
      }),
    });
  }

  /**
   * Obtém os dados de PIX (QR Code e Copia e Cola) de uma cobrança
   */
  async obterPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return this.request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
    });
  }

  /**
   * Busca detalhes de uma cobrança específica
   */
  async obterCobranca(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`, {
      method: 'GET',
    });
  }

  /**
   * Lista as cobranças de uma assinatura
   */
  async listarCobrancasAssinatura(subscriptionId: string): Promise<AsaasPayment[]> {
    const res = await this.request<{ data: AsaasPayment[] }>(
      `/subscriptions/${subscriptionId}/payments`,
      { method: 'GET' }
    );
    return res.data || [];
  }

  /**
   * Lista as cobranças de um cliente
   */
  async listarCobrancasCliente(customerId: string): Promise<AsaasPayment[]> {
    const res = await this.request<{ data: AsaasPayment[] }>(
      `/payments?customer=${encodeURIComponent(customerId)}&limit=10`,
      { method: 'GET' }
    );
    return res.data || [];
  }
}

export const asaasService = new AsaasService();

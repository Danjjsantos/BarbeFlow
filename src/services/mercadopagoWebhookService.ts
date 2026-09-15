import { MercadoPagoWebhookLog } from '../types';

export interface WebhookInfoResponse {
  success: boolean;
  webhookUrl: string;
  hasPlatformSecret: boolean;
  activeBarbersWithSecret: number;
  instructions: {
    title: string;
    steps: string[];
    events: string[];
  };
}

export interface SimulateWebhookParams {
  appointmentId?: string;
  barbershopId?: string;
  planId?: string;
  amount?: number;
  status?: 'approved' | 'in_process' | 'rejected' | 'refunded';
  customSecret?: string;
}

export interface SimulateWebhookResponse {
  success: boolean;
  message: string;
  log?: MercadoPagoWebhookLog;
  outcome?: string;
  signatureCheck?: {
    signatureProvided: boolean;
    secretConfigured: boolean;
    valid: boolean;
    computedHash?: string;
    expectedHash?: string;
  };
  matchedRecord?: {
    type: 'appointment' | 'barbershop_subscription' | 'none';
    id?: string;
    details?: string;
  };
}

/**
 * Robust JSON fetch wrapper that avoids any unexpected HTML / parsing exceptions
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    const text = await res.text();
    if (!text || !text.trim()) {
      return { ok: false, data: null, error: 'Servidor retornou resposta vazia.' };
    }

    try {
      const parsed = JSON.parse(text);
      return {
        ok: res.ok,
        data: parsed,
        error: parsed.error || parsed.message,
      };
    } catch {
      return {
        ok: false,
        data: null,
        error: 'Formato de resposta inesperado do servidor.',
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      error: err?.message || 'Falha de conexão com o servidor.',
    };
  }
}

/**
 * Fetches information about the Webhook endpoint (URL, active status, instructions)
 */
export async function getMercadoPagoWebhookInfo(): Promise<WebhookInfoResponse> {
  const result = await safeFetchJson<WebhookInfoResponse>('/api/mercadopago/webhook/info');
  if (result.ok && result.data) {
    return result.data;
  }
  
  // Safe fallback if server is starting or network blips
  const defaultUrl = `${window.location.origin}/api/mercadopago/webhook`;
  return {
    success: false,
    webhookUrl: defaultUrl,
    hasPlatformSecret: false,
    activeBarbersWithSecret: 0,
    instructions: {
      title: 'Configuração do Webhook no Mercado Pago',
      steps: [
        'Acesse mercadopago.com.br/developers e entre no seu painel.',
        'Selecione sua aplicação em "Suas integrações".',
        'Vá em "Notificações Webhooks" no menu lateral.',
        `Adicione a URL: ${defaultUrl}`,
        'Selecione os eventos de Pagamentos ("Pagamentos" ou "payment").',
        'Copie a "Chave secreta" (Secret Key) gerada e cole no campo de Chave Secreta do BarberHub.',
      ],
      events: ['payment (Pagamentos)'],
    },
  };
}

/**
 * Fetches the recent webhook events and execution logs from the database
 */
export async function getMercadoPagoWebhookLogs(): Promise<{
  success: boolean;
  logs: MercadoPagoWebhookLog[];
  error?: string;
}> {
  const result = await safeFetchJson<{ success: boolean; logs: MercadoPagoWebhookLog[] }>(
    '/api/mercadopago/webhook/logs'
  );

  if (result.ok && result.data?.logs) {
    return {
      success: true,
      logs: result.data.logs,
    };
  }

  return {
    success: false,
    logs: [],
    error: result.error || 'Não foi possível carregar os logs de webhook.',
  };
}

/**
 * Triggers a real webhook simulation that validates signatures and updates the database
 */
export async function simulateMercadoPagoWebhook(
  params: SimulateWebhookParams
): Promise<SimulateWebhookResponse> {
  const result = await safeFetchJson<SimulateWebhookResponse>(
    '/api/mercadopago/webhook/simulate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }
  );

  if (result.data) {
    return result.data;
  }

  return {
    success: false,
    message: result.error || 'Falha ao executar simulação de webhook.',
  };
}

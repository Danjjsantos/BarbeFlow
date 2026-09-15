import { MercadoPagoPixResponse } from '../types';

export interface CreatePixOptions {
  amount?: number;
  transactionAmount?: number;
  description: string;
  payerEmail?: string;
  payerName?: string;
  accessToken?: string;
  barberAccessToken?: string;
  externalReference?: string;
}

/**
 * Robust JSON fetch wrapper that guarantees it will NEVER throw
 * "Unexpected token 'T', "The page c"... is not valid JSON"
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  defaultData?: T
): Promise<{ ok: boolean; data: any; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const text = await res.text();
    if (!text || !text.trim()) {
      return { ok: false, data: defaultData, error: 'Servidor retornou resposta vazia.' };
    }

    try {
      const parsed = JSON.parse(text);
      return {
        ok: res.ok,
        data: parsed,
        error: parsed.error || parsed.message,
      };
    } catch {
      // Server returned HTML (e.g. "The page cannot be found" or 502/503)
      console.warn('API retornou resposta não-JSON em', url, text.slice(0, 100));
      return {
        ok: false,
        data: defaultData,
        error: text.includes('The page') || text.startsWith('<')
          ? 'Serviço temporariamente indisponível. O servidor retornou uma página de erro em vez de JSON.'
          : 'Formato de resposta inesperado do servidor.',
      };
    }
  } catch (err: any) {
    console.error('Falha de rede na requisição:', url, err);
    return {
      ok: false,
      data: defaultData,
      error: err?.message || 'Falha de conexão com o servidor.',
    };
  }
}

/**
 * Calls the backend API to generate a Mercado Pago PIX Payment
 */
export async function createMercadoPagoPix(
  options: CreatePixOptions
): Promise<MercadoPagoPixResponse & { payment?: { id: string; qrCode?: string; qrCodeBase64?: string; ticketUrl?: string; status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process' } }> {
  try {
    const finalAmount = options.amount ?? options.transactionAmount ?? 0;
    const finalToken = options.accessToken ?? options.barberAccessToken;

    const result = await safeFetchJson('/api/mercadopago/create-pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalAmount,
        description: options.description,
        payerEmail: options.payerEmail || 'cliente@barberhub.com.br',
        payerName: options.payerName || 'Cliente BarberHub',
        accessToken: finalToken,
        externalReference: options.externalReference,
      }),
    });

    const data = result.data || {};
    if (data.paymentId && !data.payment) {
      data.payment = {
        id: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl: data.ticketUrl,
        status: data.status,
      };
    }

    if (!result.ok && !data.success) {
      return {
        success: false,
        paymentId: '',
        status: 'pending',
        error: result.error || data.error || 'Erro ao comunicar com a API do Mercado Pago',
        ...data,
      };
    }

    return data;
  } catch (err: any) {
    console.error('Failed to create Mercado Pago PIX:', err);
    return {
      success: false,
      paymentId: '',
      status: 'pending',
      error: err?.message || 'Erro ao comunicar com a API do Mercado Pago',
    };
  }
}

/**
 * Polls or checks payment status from backend / Mercado Pago API
 */
export async function checkMercadoPagoPaymentStatus(
  paymentId: string,
  accessToken?: string
): Promise<{
  success: boolean;
  paymentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  statusDetail?: string;
  dateApproved?: string;
  isRealMercadoPago?: boolean;
  payment?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
    statusDetail?: string;
  };
  error?: string;
}> {
  if (!paymentId) {
    return {
      success: false,
      paymentId: '',
      status: 'pending',
      payment: {
        id: '',
        status: 'pending',
      },
      error: 'ID de pagamento não informado',
    };
  }

  try {
    const query = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : '';
    const result = await safeFetchJson(`/api/mercadopago/status/${encodeURIComponent(paymentId)}${query}`);

    const data = result.data || {};
    if (data && !data.payment) {
      data.payment = {
        id: data.paymentId || paymentId,
        status: data.status || 'pending',
        statusDetail: data.statusDetail,
      };
    }

    if (!result.ok && !data.success) {
      return {
        success: false,
        paymentId,
        status: data.status || 'pending',
        payment: {
          id: paymentId,
          status: data.status || 'pending',
        },
        error: result.error || data.error,
      };
    }

    return data;
  } catch (err: any) {
    console.error('Failed to check Mercado Pago status:', err);
    return {
      success: false,
      paymentId,
      status: 'pending',
      payment: {
        id: paymentId,
        status: 'pending',
      },
      error: err?.message || 'Erro ao verificar status',
    };
  }
}

/**
 * Simulates approval of a payment for testing/demonstration
 */
export async function simulateMercadoPagoPaymentApproval(
  paymentId: string
): Promise<{ success: boolean; message: string }> {
  if (!paymentId) {
    return {
      success: false,
      message: 'ID de pagamento inválido',
    };
  }

  try {
    const result = await safeFetchJson('/api/mercadopago/simulate-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId }),
    });

    if (!result.ok || !result.data) {
      return {
        success: false,
        message: result.error || 'Erro ao simular aprovação do pagamento',
      };
    }

    return result.data;
  } catch (err: any) {
    console.error('Failed to simulate payment:', err);
    return {
      success: false,
      message: err?.message || 'Erro ao simular aprovação',
    };
  }
}

export const simulateApproveMercadoPagoPayment = simulateMercadoPagoPaymentApproval;

/**
 * Tests whether a provided Mercado Pago Access Token is valid
 */
export async function testMercadoPagoCredentials(
  accessToken: string
): Promise<{
  success: boolean;
  nickname?: string;
  email?: string;
  message?: string;
  hasPix?: boolean;
  siteId?: string;
  error?: string;
}> {
  if (!accessToken || !accessToken.trim()) {
    return {
      success: false,
      error: 'Por favor, informe seu Access Token do Mercado Pago.',
    };
  }

  try {
    const result = await safeFetchJson('/api/mercadopago/test-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });

    if (result.data) {
      return result.data;
    }

    return {
      success: false,
      error: result.error || 'Falha ao conectar com o serviço de validação do Mercado Pago.',
    };
  } catch (err: any) {
    console.error('Failed to test token:', err);
    return {
      success: false,
      error: err?.message || 'Erro ao testar credenciais',
    };
  }
}

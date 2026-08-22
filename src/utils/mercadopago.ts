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
 * Calls the backend API to generate a Mercado Pago PIX Payment
 */
export async function createMercadoPagoPix(
  options: CreatePixOptions
): Promise<MercadoPagoPixResponse & { payment?: { id: string; qrCode?: string; qrCodeBase64?: string; ticketUrl?: string; status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process' } }> {
  try {
    const finalAmount = options.amount ?? options.transactionAmount ?? 0;
    const finalToken = options.accessToken ?? options.barberAccessToken;

    const res = await fetch('/api/mercadopago/create-pix', {
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

    const data = await res.json();
    if (data.paymentId && !data.payment) {
      data.payment = {
        id: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl: data.ticketUrl,
        status: data.status,
      };
    }
    return data;
  } catch (err: any) {
    console.error('Failed to create Mercado Pago PIX:', err);
    return {
      success: false,
      paymentId: '',
      status: 'pending',
      error: err.message || 'Erro ao comunicar com a API do Mercado Pago',
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
}> {
  try {
    const query = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : '';
    const res = await fetch(`/api/mercadopago/status/${paymentId}${query}`);
    const data = await res.json();
    if (data && !data.payment) {
      data.payment = {
        id: data.paymentId || paymentId,
        status: data.status,
        statusDetail: data.statusDetail,
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
    };
  }
}

/**
 * Simulates approval of a payment for testing/demonstration
 */
export async function simulateMercadoPagoPaymentApproval(
  paymentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/mercadopago/simulate-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('Failed to simulate payment:', err);
    return {
      success: false,
      message: err.message,
    };
  }
}

export const simulateApproveMercadoPagoPayment = simulateMercadoPagoPaymentApproval;

/**
 * Tests whether a provided Mercado Pago Access Token is valid
 */
export async function testMercadoPagoCredentials(
  accessToken: string
): Promise<{ success: boolean; nickname?: string; email?: string; message?: string; hasPix?: boolean; siteId?: string; error?: string }> {
  try {
    const res = await fetch('/api/mercadopago/test-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('Failed to test token:', err);
    return {
      success: false,
      error: err.message || 'Erro ao testar credenciais',
    };
  }
}

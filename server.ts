import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { generatePixPayload, generateQrCodeDataUrl } from './src/utils/pix';

dotenv.config();

// In-memory payment store for status tracking and simulation fallbacks
interface StoredPayment {
  id: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  statusDetail?: string;
  dateCreated: string;
  dateApproved?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  externalReference?: string;
  isRealMercadoPago?: boolean;
}

const paymentsStore = new Map<string, StoredPayment>();

function sanitizeToken(token?: string): string {
  if (!token) return '';
  let cleaned = token.trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  if (cleaned.toLowerCase().startsWith('bearer ')) {
    cleaned = cleaned.substring(7).trim();
  }
  return cleaned;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  /**
   * POST /api/mercadopago/create-pix
   * Creates a PIX payment via Mercado Pago API (or local EMV simulation if token not provided)
   */
  app.post('/api/mercadopago/create-pix', async (req, res) => {
    try {
      const {
        amount,
        description,
        payerEmail,
        payerName,
        accessToken: customAccessToken,
        externalReference,
      } = req.body;

      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valor inválido para o pagamento PIX.',
        });
      }

      // Priority: Custom token from Barber/Platform settings -> .env MERCADO_PAGO_ACCESS_TOKEN
      const token = sanitizeToken(customAccessToken) || sanitizeToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

      if (token) {
        try {
          const idempotencyKey = `mp_pix_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          // Strict email validation for Mercado Pago API
          let cleanEmail = (payerEmail || '').trim().toLowerCase();
          cleanEmail = cleanEmail.replace(/[^a-z0-9@._-]/g, '');
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            cleanEmail = `cliente_${Date.now()}@barberhub.com.br`;
          }

          // Clean payer names (letters and basic chars only)
          const cleanName = (payerName || 'Cliente').trim().replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, '');
          const nameParts = cleanName.split(/\s+/).filter(Boolean);
          const payerFirstName = nameParts[0] || 'Cliente';
          const payerLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'BarberHub';

          // Clean description (max 60 chars)
          const cleanDescription = (description || 'Servico BarberHub')
            .replace(/[^a-zA-Z0-9\sÀ-ÿ._-]/g, '')
            .substring(0, 60)
            .trim() || 'Servico BarberHub';

          const mpRequestBody: Record<string, any> = {
            transaction_amount: Number(numAmount.toFixed(2)),
            description: cleanDescription,
            payment_method_id: 'pix',
            payer: {
              email: cleanEmail,
              first_name: payerFirstName,
              last_name: payerLastName,
            },
            external_reference: (externalReference || `ref_${Date.now()}`).substring(0, 64),
          };

          const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'X-Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(mpRequestBody),
          });

          const mpData = await mpResponse.json();

          if (mpResponse.ok && mpData.id) {
            const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || '';
            let qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '';
            const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || '';

            // If base64 from MP is missing or raw, generate valid ISO QR code PNG data URL
            if (!qrCodeBase64 && qrCode) {
              const fullDataUrl = await generateQrCodeDataUrl(qrCode, 320);
              qrCodeBase64 = fullDataUrl.replace(/^data:image\/png;base64,/, '');
            }

            const paymentObj: StoredPayment = {
              id: String(mpData.id),
              amount: numAmount,
              description: description || 'Pagamento BarberHub',
              status: mpData.status || 'pending',
              statusDetail: mpData.status_detail,
              dateCreated: mpData.date_created || new Date().toISOString(),
              qrCode,
              qrCodeBase64,
              ticketUrl,
              externalReference: mpData.external_reference,
              isRealMercadoPago: true,
            };

            paymentsStore.set(String(mpData.id), paymentObj);

            return res.json({
              success: true,
              paymentId: String(mpData.id),
              status: mpData.status,
              qrCode,
              qrCodeBase64,
              ticketUrl,
              isRealMercadoPago: true,
              payment: {
                id: String(mpData.id),
                status: mpData.status,
                qrCode,
                qrCodeBase64,
                ticketUrl,
              },
            });
          } else {
            console.warn('Mercado Pago API returned error status:', mpResponse.status, mpData);
          }
        } catch (apiErr: any) {
          console.error('Error contacting Mercado Pago API:', apiErr);
        }
      }

      // Fallback: Generate real standard EMV PIX with genuine scannable QR Code
      const localId = `pix_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const emvPayload = generatePixPayload({
        pixKey: 'financeiro@barberhub.com.br',
        receiverName: 'BARBERHUB TECNOLOGIA LTDA',
        amount: numAmount,
        txId: `BH${localId.substring(localId.length - 8).toUpperCase()}`,
        description: description || 'Serviço Barbearia BarberHub',
      });

      const qrCodeDataUrl = await generateQrCodeDataUrl(emvPayload, 320);
      const cleanBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

      const paymentObj: StoredPayment = {
        id: localId,
        amount: numAmount,
        description: description || 'Serviço Barbearia BarberHub',
        status: 'pending',
        statusDetail: 'waiting_payment',
        dateCreated: new Date().toISOString(),
        qrCode: emvPayload,
        qrCodeBase64: cleanBase64,
        externalReference,
        isRealMercadoPago: false,
      };

      paymentsStore.set(localId, paymentObj);

      return res.json({
        success: true,
        paymentId: localId,
        status: 'pending',
        qrCode: emvPayload,
        qrCodeBase64: cleanBase64,
        isRealMercadoPago: false,
        payment: {
          id: localId,
          status: 'pending',
          qrCode: emvPayload,
          qrCodeBase64: cleanBase64,
        },
      });
    } catch (err: any) {
      console.error('Create PIX Handler Error:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao processar requisição de PIX: ' + err.message,
      });
    }
  });

  /**
   * GET /api/mercadopago/status/:id
   * Checks status of a payment via Mercado Pago API or local store
   */
  app.get('/api/mercadopago/status/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const customAccessToken = req.query.accessToken as string;
      const token = sanitizeToken(customAccessToken) || sanitizeToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

      const stored = paymentsStore.get(id);

      // If numeric ID or marked as real Mercado Pago and token exists, query real Mercado Pago
      if (token && id && /^\d+$/.test(id)) {
        try {
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (mpRes.ok) {
            const mpData = await mpRes.json();
            const currentStatus = mpData.status;

            if (stored) {
              stored.status = currentStatus;
              if (currentStatus === 'approved') {
                stored.dateApproved = mpData.date_approved || new Date().toISOString();
              }
            }

            return res.json({
              success: true,
              paymentId: String(mpData.id),
              status: currentStatus,
              statusDetail: mpData.status_detail,
              dateApproved: mpData.date_approved,
              isRealMercadoPago: true,
              payment: {
                id: String(mpData.id),
                status: currentStatus,
                statusDetail: mpData.status_detail,
              },
            });
          }
        } catch (mpErr) {
          console.error('Error fetching status from MP API:', mpErr);
        }
      }

      // Check stored payment
      if (stored) {
        return res.json({
          success: true,
          paymentId: stored.id,
          status: stored.status,
          statusDetail: stored.statusDetail,
          dateApproved: stored.dateApproved,
          isRealMercadoPago: stored.isRealMercadoPago,
          payment: {
            id: stored.id,
            status: stored.status,
            statusDetail: stored.statusDetail,
          },
        });
      }

      return res.json({
        success: true,
        paymentId: id,
        status: 'pending',
        payment: {
          id,
          status: 'pending',
        },
      });
    } catch (err: any) {
      console.error('Status Check Error:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  /**
   * POST /api/mercadopago/simulate-approval
   * Instantly approves a payment for demonstration / testing
   */
  app.post('/api/mercadopago/simulate-approval', (req, res) => {
    try {
      const { paymentId } = req.body;
      if (!paymentId) {
        return res.status(400).json({ success: false, error: 'Payment ID is required' });
      }

      let stored = paymentsStore.get(paymentId);
      if (!stored) {
        stored = {
          id: paymentId,
          amount: 0,
          description: 'Simulação de Pagamento',
          status: 'approved',
          statusDetail: 'accredited',
          dateCreated: new Date().toISOString(),
          dateApproved: new Date().toISOString(),
          isRealMercadoPago: false,
        };
        paymentsStore.set(paymentId, stored);
      } else {
        stored.status = 'approved';
        stored.statusDetail = 'accredited';
        stored.dateApproved = new Date().toISOString();
      }

      return res.json({
        success: true,
        message: 'Pagamento aprovado com sucesso!',
        payment: stored,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/mercadopago/test-token
   * Validates a Mercado Pago Access Token using /users/me and fallback /v1/payment_methods
   */
  app.post('/api/mercadopago/test-token', async (req, res) => {
    try {
      const { accessToken } = req.body;
      const token = sanitizeToken(accessToken) || sanitizeToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum Access Token fornecido. Insira seu token de Produção ou Teste (APP_USR-... ou TEST-...).',
        });
      }

      // Check 1: Try /v1/payment_methods first (Standard for Application Tokens & Payments)
      const pmRes = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (pmRes.ok) {
        const pmData = await pmRes.json();
        const hasPix = Array.isArray(pmData) && pmData.some((pm: any) => pm.id === 'pix');

        // Optional: Also try to get user details from /users/me
        let nickname = 'Credencial Mercado Pago Válida';
        let email: string | undefined = undefined;
        try {
          const userRes = await fetch('https://api.mercadopago.com/users/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            nickname = userData.nickname || userData.first_name || nickname;
            email = userData.email;
          }
        } catch {
          // If users/me is restricted by policy, payment_methods is sufficient!
        }

        return res.json({
          success: true,
          nickname: nickname,
          email: email,
          hasPix,
          message: hasPix
            ? 'Access Token válido e autorizado para cobranças PIX!'
            : 'Access Token conectado com sucesso ao Mercado Pago.',
        });
      }

      // Check 2: Try /users/me as fallback
      const mpRes = await fetch('https://api.mercadopago.com/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (mpRes.ok) {
        const userData = await mpRes.json();
        return res.json({
          success: true,
          nickname: userData.nickname || userData.first_name || 'Conta Mercado Pago',
          email: userData.email,
          siteId: userData.site_id,
        });
      } else {
        const errorData = await pmRes.json().catch(() => ({}));
        let errorMsg = errorData.message || errorData.error || '';
        
        if (errorMsg.includes('UNAUTHORIZED') || pmRes.status === 401) {
          errorMsg = 'Access Token inválido ou não autorizado. Verifique se copiou o "Access Token" (e não a Public Key) no painel do Mercado Pago.';
        }

        return res.json({
          success: false,
          error: errorMsg || 'Access Token inválido ou não autorizado no Mercado Pago.',
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 'Erro de conexão com o Mercado Pago: ' + err.message,
      });
    }
  });

  /**
   * POST /api/mercadopago/webhook
   * Mercado Pago IPN / Webhooks handler
   */
  app.post('/api/mercadopago/webhook', async (req, res) => {
    try {
      const topic = req.query.topic || req.body?.type;
      const id = req.query.id || req.body?.data?.id;

      if (topic === 'payment' && id) {
        const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (token) {
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (mpRes.ok) {
            const data = await mpRes.json();
            const stored = paymentsStore.get(String(id));
            if (stored) {
              stored.status = data.status;
              if (data.status === 'approved') {
                stored.dateApproved = data.date_approved;
              }
            }
          }
        }
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(200).send('OK');
    }
  });

  // Vite integration: middleware for development & static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BarberHub server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

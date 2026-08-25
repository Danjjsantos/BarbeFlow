import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { generatePixPayload, generateQrCodeDataUrl } from './src/utils/pix';
import {
  INITIAL_PLATFORM_SETTINGS,
  INITIAL_TRIAL_RECORDS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_BARBERSHOPS,
  INITIAL_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_USERS,
  INITIAL_LANDING_CONTENT,
} from './src/data/initialData';

dotenv.config();

// ----------------------------------------------------
// Persistent Local Server Database
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

function initLocalDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        barbershops: INITIAL_BARBERSHOPS,
        services: INITIAL_SERVICES,
        appointments: INITIAL_APPOINTMENTS,
        users: INITIAL_USERS,
        plans: INITIAL_SUBSCRIPTION_PLANS,
        settings: INITIAL_PLATFORM_SETTINGS,
        trialRecords: INITIAL_TRIAL_RECORDS,
        landing: INITIAL_LANDING_CONTENT,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Failed to init local database file:', e);
  }
}

function getLocalDatabase() {
  try {
    initLocalDatabase();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        barbershops: Array.isArray(parsed.barbershops) ? parsed.barbershops : INITIAL_BARBERSHOPS,
        services: Array.isArray(parsed.services) ? parsed.services : INITIAL_SERVICES,
        appointments: Array.isArray(parsed.appointments) ? parsed.appointments : INITIAL_APPOINTMENTS,
        users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS,
        plans: Array.isArray(parsed.plans) ? parsed.plans : INITIAL_SUBSCRIPTION_PLANS,
        settings: parsed.settings ? { ...INITIAL_PLATFORM_SETTINGS, ...parsed.settings } : INITIAL_PLATFORM_SETTINGS,
        trialRecords: Array.isArray(parsed.trialRecords) ? parsed.trialRecords : INITIAL_TRIAL_RECORDS,
        landing: parsed.landing ? { ...INITIAL_LANDING_CONTENT, ...parsed.landing } : INITIAL_LANDING_CONTENT,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.error('Failed to read local database:', e);
  }
  return {
    barbershops: INITIAL_BARBERSHOPS,
    services: INITIAL_SERVICES,
    appointments: INITIAL_APPOINTMENTS,
    users: INITIAL_USERS,
    plans: INITIAL_SUBSCRIPTION_PLANS,
    settings: INITIAL_PLATFORM_SETTINGS,
    trialRecords: INITIAL_TRIAL_RECORDS,
    landing: INITIAL_LANDING_CONTENT,
    lastUpdated: new Date().toISOString(),
  };
}

function saveLocalDatabase(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = getLocalDatabase();
    const updated = {
      ...current,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (e) {
    console.error('Failed to save local database:', e);
    return null;
  }
}

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

  // Initialize server database on startup
  initLocalDatabase();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ----------------------------------------------------
  // Local Database Persistence API
  // ----------------------------------------------------
  app.get('/api/db/data', (req, res) => {
    try {
      const db = getLocalDatabase();
      return res.json({ success: true, data: db });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post('/api/db/save', (req, res) => {
    try {
      const { table, data, action = 'upsert' } = req.body || {};
      if (!table) return res.status(400).json({ success: false, error: 'Tabela não informada' });

      const currentDb = getLocalDatabase();

      if (table === 'barbershops') {
        if (action === 'delete') {
          currentDb.barbershops = currentDb.barbershops.filter((item: any) => item.id !== data?.id && item.id !== data);
        } else {
          const idx = currentDb.barbershops.findIndex((item: any) => item.id === data.id);
          if (idx >= 0) currentDb.barbershops[idx] = { ...currentDb.barbershops[idx], ...data };
          else currentDb.barbershops.push(data);
        }
      } else if (table === 'services') {
        if (action === 'delete') {
          currentDb.services = currentDb.services.filter((item: any) => item.id !== data?.id && item.id !== data);
        } else {
          const idx = currentDb.services.findIndex((item: any) => item.id === data.id);
          if (idx >= 0) currentDb.services[idx] = { ...currentDb.services[idx], ...data };
          else currentDb.services.push(data);
        }
      } else if (table === 'appointments') {
        if (action === 'delete') {
          currentDb.appointments = currentDb.appointments.filter((item: any) => item.id !== data?.id && item.id !== data);
        } else {
          const idx = currentDb.appointments.findIndex((item: any) => item.id === data.id);
          if (idx >= 0) currentDb.appointments[idx] = { ...currentDb.appointments[idx], ...data };
          else currentDb.appointments.unshift(data);
        }
      } else if (table === 'users') {
        if (action === 'delete') {
          currentDb.users = currentDb.users.filter((item: any) => item.id !== data?.id && item.id !== data);
        } else {
          const idx = currentDb.users.findIndex((item: any) => item.id === data.id);
          if (idx >= 0) currentDb.users[idx] = { ...currentDb.users[idx], ...data };
          else currentDb.users.push(data);
        }
      } else if (table === 'plans' || table === 'subscription_plans') {
        if (action === 'delete') {
          currentDb.plans = currentDb.plans.filter((item: any) => item.id !== data?.id && item.id !== data);
        } else {
          const idx = currentDb.plans.findIndex((item: any) => item.id === data.id);
          if (idx >= 0) currentDb.plans[idx] = { ...currentDb.plans[idx], ...data };
          else currentDb.plans.push(data);
        }
      } else if (table === 'settings' || table === 'platform_settings') {
        currentDb.settings = { ...currentDb.settings, ...data };
        if (data.platformLogoUrl) {
          currentDb.landing = { ...currentDb.landing, brandLogoUrl: data.platformLogoUrl };
        }
      } else if (table === 'landing' || table === 'landing_page_content') {
        currentDb.landing = { ...currentDb.landing, ...data };
        if (data.brandLogoUrl) {
          currentDb.settings = { ...currentDb.settings, platformLogoUrl: data.brandLogoUrl };
        }
      } else if (table === 'trialRecords' || table === 'trial_records') {
        if (action === 'delete') {
          currentDb.trialRecords = currentDb.trialRecords.filter((item: any) => item.id !== data?.id && item.id !== data);
        } else {
          const idx = currentDb.trialRecords.findIndex((item: any) => item.id === data.id);
          if (idx >= 0) currentDb.trialRecords[idx] = { ...currentDb.trialRecords[idx], ...data };
          else currentDb.trialRecords.unshift(data);
        }
      }

      const updated = saveLocalDatabase(currentDb);
      return res.json({ success: true, data: updated });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post('/api/db/sync', (req, res) => {
    try {
      const {
        barbershops,
        services,
        appointments,
        users,
        plans,
        settings,
        trialRecords,
        landing,
      } = req.body || {};

      const currentDb = getLocalDatabase();
      if (barbershops) currentDb.barbershops = barbershops;
      if (services) currentDb.services = services;
      if (appointments) currentDb.appointments = appointments;
      if (users) currentDb.users = users;
      if (plans) currentDb.plans = plans;
      if (settings) currentDb.settings = { ...currentDb.settings, ...settings };
      if (trialRecords) currentDb.trialRecords = trialRecords;
      if (landing) currentDb.landing = { ...currentDb.landing, ...landing };

      const updated = saveLocalDatabase(currentDb);
      return res.json({ success: true, message: 'Banco de dados sincronizado e salvo no servidor com sucesso!', data: updated });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Supabase Backend Status Check
  app.get('/api/supabase/status', async (req, res) => {
    const customUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const customKey = typeof req.query.key === 'string' ? req.query.key : '';

    const supabaseUrl = customUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ddwkyabkbybyqvulcvxs.supabase.co';
    const supabaseKey = (customKey || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_oWooNwDsp16j9xnP54cBAQ_tQCzfiYX').trim();
    
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '').trim();
      const startTime = Date.now();
      const testRes = await fetch(`${cleanUrl}/rest/v1/barbershops?select=id&limit=1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      const elapsed = Date.now() - startTime;

      if (testRes.ok) {
        return res.json({
          success: true,
          connected: true,
          status: 'connected',
          url: cleanUrl,
          elapsedMs: elapsed,
          message: `Conectado com sucesso em ${elapsed}ms! Banco de dados operacional.`,
        });
      } else {
        const errText = await testRes.text();
        let friendlyMessage = `Supabase respondeu com código ${testRes.status}: ${errText}`;
        if (testRes.status === 404 || errText.includes('42P01') || errText.includes('does not exist') || errText.includes('relation')) {
          friendlyMessage = 'Tabelas não encontradas no Supabase. Execute o script SQL no SQL Editor do Supabase.';
        } else if (testRes.status === 401 || testRes.status === 403 || errText.includes('JWT') || errText.includes('apikey')) {
          friendlyMessage = 'Chave do Supabase inválida ou expirada. Verifique a anon key nas configurações.';
        }

        return res.json({
          success: false,
          connected: false,
          status: 'error',
          httpStatus: testRes.status,
          message: friendlyMessage,
        });
      }
    } catch (err: any) {
      return res.json({
        success: false,
        connected: false,
        status: 'fetch_error',
        message: err?.message || 'Falha ao contactar Supabase a partir do servidor.',
      });
    }
  });

  // Supabase Backend Sync All Route
  app.post('/api/supabase/sync', async (req, res) => {
    const {
      barbershops = [],
      services = [],
      appointments = [],
      users = [],
      plans = [],
      settings,
      trialRecords = [],
      landing,
      customUrl,
      customKey,
    } = req.body || {};

    const supabaseUrl = customUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ddwkyabkbybyqvulcvxs.supabase.co';
    const supabaseKey = (customKey || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_oWooNwDsp16j9xnP54cBAQ_tQCzfiYX').trim();
    const cleanUrl = supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '').trim();

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    };

    const upsertTable = async (table: string, records: any[]) => {
      if (!records || records.length === 0) return { ok: true };
      const response = await fetch(`${cleanUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(records),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tabela ${table} (HTTP ${response.status}): ${errorText}`);
      }
      return { ok: true };
    };

    try {
      if (barbershops.length > 0) await upsertTable('barbershops', barbershops);
      if (services.length > 0) await upsertTable('services', services);
      if (appointments.length > 0) await upsertTable('appointments', appointments);
      if (users.length > 0) await upsertTable('users', users);
      if (plans.length > 0) await upsertTable('subscription_plans', plans);
      if (settings) await upsertTable('platform_settings', [settings]);
      if (trialRecords.length > 0) await upsertTable('trial_records', trialRecords);
      if (landing) await upsertTable('landing_page_content', [landing]);

      return res.json({
        success: true,
        message: 'Todos os dados foram sincronizados com o Supabase com sucesso!',
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Erro desconhecido durante a sincronização.';
      let friendlyMessage = errMsg;
      if (errMsg.includes('42P01') || errMsg.includes('does not exist') || errMsg.includes('relation')) {
        friendlyMessage = 'Tabelas não encontradas no Supabase. Execute o script SQL no menu SQL Editor do Supabase antes de sincronizar.';
      } else if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('JWT') || errMsg.includes('apikey')) {
        friendlyMessage = 'Erro de autenticação com o Supabase. Verifique a anon key.';
      }

      return res.status(400).json({
        success: false,
        message: `Falha na sincronização: ${friendlyMessage}`,
      });
    }
  });

  // Supabase Backend Generic Proxy Route
  app.post('/api/supabase/proxy', async (req, res) => {
    const { table, method = 'GET', data, query = '', customUrl, customKey } = req.body || {};
    if (!table) return res.status(400).json({ error: 'Tabela não especificada' });

    const supabaseUrl = customUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ddwkyabkbybyqvulcvxs.supabase.co';
    const supabaseKey = (customKey || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_oWooNwDsp16j9xnP54cBAQ_tQCzfiYX').trim();
    const cleanUrl = supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '').trim();

    try {
      const targetUrl = `${cleanUrl}/rest/v1/${table}${query ? `?${query}` : ''}`;
      const headers: Record<string, string> = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      };
      if (method === 'POST' || method === 'PATCH') {
        headers['Prefer'] = 'resolution=merge-duplicates';
      }

      const response = await fetch(targetUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const resData = await response.json().catch(() => null);
      return res.json({ success: true, data: resData });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Proxy error' });
    }
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

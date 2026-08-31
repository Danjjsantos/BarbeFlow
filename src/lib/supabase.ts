import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Barbershop,
  Service,
  Appointment,
  User,
  SubscriptionPlan,
  PlatformSettings,
  TrialUserRecord,
  LandingPageContent,
} from '../types';
import { INITIAL_LANDING_CONTENT } from '../data/initialData';

// Helper to normalize Supabase URL in case /rest/v1 or trailing slashes were provided
export function normalizeSupabaseUrl(url: string): string {
  let cleaned = (url || '').trim();
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/auth\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/graphql\/v1\/?$/i, '');
  return cleaned.trim();
}

// Default Supabase project URL and Anon Key
// Can be customized via environment variables or stored locally in localStorage for development
export const DEFAULT_SUPABASE_URL = normalizeSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL || 'https://ddwkyabkbybyqvulcvxs.supabase.co'
);

export const DEFAULT_SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_oWooNwDsp16j9xnP54cBAQ_tQCzfiYX').trim();

// Stored config keys
const STORAGE_URL_KEY = 'barberclock_supabase_url';
const STORAGE_KEY_KEY = 'barberclock_supabase_key';

export function getStoredSupabaseConfig() {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
  }
  let rawUrl = localStorage.getItem(STORAGE_URL_KEY);
  let key = localStorage.getItem(STORAGE_KEY_KEY);

  // If stored URL was the old deprecated project or invalid, reset to DEFAULT_SUPABASE_URL
  if (!rawUrl || rawUrl.includes('wdahhlpgjlagmzkxvrvk') || rawUrl.includes('/rest/v1') || rawUrl.includes('placeholder')) {
    rawUrl = DEFAULT_SUPABASE_URL;
    try {
      localStorage.setItem(STORAGE_URL_KEY, DEFAULT_SUPABASE_URL);
    } catch {}
  }
  if (!key || key.includes('sb_publishable_u1TvY_Xu')) {
    key = DEFAULT_SUPABASE_ANON_KEY;
    try {
      localStorage.setItem(STORAGE_KEY_KEY, DEFAULT_SUPABASE_ANON_KEY);
    } catch {}
  }
  return { url: normalizeSupabaseUrl(rawUrl), key: key.trim() };
}

export function saveStoredSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    const normalized = normalizeSupabaseUrl(url);
    localStorage.setItem(STORAGE_URL_KEY, normalized);
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    supabaseInstance = null; // reset client to re-initialize

    // Sync to backend server
    fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalized, key: key.trim() }),
    }).catch((err) => console.warn('Failed to sync supabase config to server:', err));
  }
}

export function resetStoredSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
    supabaseInstance = null;
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getStoredSupabaseConfig();
  const normalizedUrl = normalizeSupabaseUrl(url);
  if (!normalizedUrl || !key || !normalizedUrl.startsWith('http')) {
    return null;
  }

  try {
    supabaseInstance = createClient(normalizedUrl, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 10);
}

// ----------------------------------------------------
// SQL Schema helper for easy setup
// ----------------------------------------------------
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- BARBERCLOCK - SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 0. GARANTIR PERMISSÕES NO SCHEMA PUBLIC (Postgres 15+)
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT USAGE, CREATE ON SCHEMA public TO postgres, service_role, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role, anon, authenticated;

-- 1. TABELA DE BARBEARIAS (barbershops)
CREATE TABLE IF NOT EXISTS barbershops (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  instagram TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  theme_color TEXT DEFAULT '#d97706',
  pix_key TEXT DEFAULT '',
  pix_key_type TEXT DEFAULT 'phone',
  pix_receiver_name TEXT DEFAULT '',
  mercado_pago_access_token TEXT DEFAULT '',
  mercado_pago_public_key TEXT DEFAULT '',
  mercado_pago_enabled BOOLEAN DEFAULT false,
  subscription_plan_id TEXT DEFAULT 'trial',
  subscription_status TEXT DEFAULT 'active',
  subscription_monthly_fee NUMERIC DEFAULT 49.90,
  subscription_valid_until TEXT DEFAULT '',
  subscription_proof_url TEXT DEFAULT '',
  subscription_requested_at TEXT DEFAULT '',
  subscription_last_payment_date TEXT DEFAULT '',
  working_hours JSONB DEFAULT '{}'::jsonb,
  slot_interval_minutes INTEGER DEFAULT 30,
  booking_window_days INTEGER DEFAULT 30,
  confirmation_mode TEXT DEFAULT 'pix',
  accepted_payment_methods JSONB DEFAULT '["pix_manual","cash","card"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para barbershops caso a tabela já existisse
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS owner_phone TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#d97706';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS pix_key TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'phone';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS pix_receiver_name TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS mercado_pago_access_token TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS mercado_pago_public_key TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS mercado_pago_enabled BOOLEAN DEFAULT false;
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'trial';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_monthly_fee NUMERIC DEFAULT 49.90;
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_valid_until TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_proof_url TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_requested_at TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS subscription_last_payment_date TEXT DEFAULT '';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER DEFAULT 30;
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 30;
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS confirmation_mode TEXT DEFAULT 'pix';
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["pix_manual","cash","card"]'::jsonb;
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. TABELA DE SERVIÇOS (services)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  barbershop_id TEXT NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  category TEXT NOT NULL DEFAULT 'cabelo',
  active BOOLEAN NOT NULL DEFAULT true,
  icon_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para services
ALTER TABLE services ADD COLUMN IF NOT EXISTS barbershop_id TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'cabelo';
ALTER TABLE services ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. TABELA DE AGENDAMENTOS (appointments)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  barbershop_id TEXT NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  pix_key_used TEXT DEFAULT '',
  pix_transaction_code TEXT DEFAULT '',
  pix_paid_at TEXT DEFAULT '',
  pix_proof_url TEXT DEFAULT '',
  mercado_pago_payment_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  cancellation_reason TEXT DEFAULT '',
  cancelled_by TEXT DEFAULT '',
  cancelled_at TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'pix_manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS barbershop_id TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS barber_name TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_id TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_price NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS time TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pix_key_used TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pix_transaction_code TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pix_paid_at TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pix_proof_url TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix_manual';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. TABELA DE USUÁRIOS (users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  password TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'client',
  barbershop_id TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE users ADD COLUMN IF NOT EXISTS barbershop_id TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. TABELA DE PLANOS DE ASSINATURA (subscription_plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  period_months INTEGER DEFAULT 1,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  monthly_equivalent NUMERIC NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  is_popular BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS period_months INTEGER DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT NULL;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS monthly_equivalent NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. TABELA DE CONFIGURAÇÕES DA PLATAFORMA (platform_settings)
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  platform_name TEXT DEFAULT 'BarberClock',
  platform_logo_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  platform_pix_key TEXT DEFAULT '',
  platform_pix_key_type TEXT DEFAULT 'phone',
  platform_pix_receiver_name TEXT DEFAULT '',
  monthly_fee NUMERIC DEFAULT 49.90,
  support_phone TEXT DEFAULT '',
  support_email TEXT DEFAULT '',
  pix_instructions TEXT DEFAULT '',
  mercado_pago_access_token TEXT DEFAULT '',
  mercado_pago_public_key TEXT DEFAULT '',
  mercado_pago_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para platform_settings
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT 'BarberClock';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_logo_url TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_pix_key TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_pix_key_type TEXT DEFAULT 'phone';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_pix_receiver_name TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 49.90;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS pix_instructions TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS mercado_pago_access_token TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS mercado_pago_public_key TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS mercado_pago_enabled BOOLEAN DEFAULT false;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7. TABELA DE REGISTROS DE TESTE GRÁTIS (trial_records)
CREATE TABLE IF NOT EXISTS trial_records (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  barbershop_id TEXT DEFAULT '',
  barbershop_name TEXT DEFAULT '',
  registered_at TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para trial_records
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS barbershop_id TEXT DEFAULT '';
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS barbershop_name TEXT DEFAULT '';
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS registered_at TEXT DEFAULT '';
ALTER TABLE trial_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 8. TABELA DE CONTEÚDO DA LANDING PAGE (landing_page_content)
CREATE TABLE IF NOT EXISTS landing_page_content (
  id TEXT PRIMARY KEY DEFAULT 'current',
  brand_logo_url TEXT DEFAULT '',
  hero_tag TEXT DEFAULT '',
  hero_title TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  hero_cta_text TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  video_title TEXT DEFAULT '',
  video_description TEXT DEFAULT '',
  video_poster_url TEXT DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  testimonials JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  cta_title TEXT DEFAULT '',
  cta_subtitle TEXT DEFAULT '',
  cta_button_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para landing_page_content (garante compatibilidade com qualquer schema anterior)
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS brand_logo_url TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_tag TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_title TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_description TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_poster_url TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS cta_title TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS cta_subtitle TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS cta_button_text TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Inserção de registros padrão se não existirem
INSERT INTO platform_settings (id, platform_name) 
VALUES ('current', 'BarberClock') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO landing_page_content (id, hero_title, hero_subtitle, hero_cta_text) 
VALUES ('current', 'O Sistema de Agendamento Definitivo para a sua Barbearia', 'Aumente seus agendamentos, elimine faltas e receba pagamentos via PIX e Mercado Pago automaticamente.', 'Começar Teste Grátis de 30 Dias') 
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) COM POLÍTICAS ABERTAS P/ CLIENT
-- ============================================================
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para chave pública (anon)
DROP POLICY IF EXISTS "Public access for barbershops" ON barbershops;
CREATE POLICY "Public access for barbershops" ON barbershops FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for services" ON services;
CREATE POLICY "Public access for services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for appointments" ON appointments;
CREATE POLICY "Public access for appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for users" ON users;
CREATE POLICY "Public access for users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for subscription_plans" ON subscription_plans;
CREATE POLICY "Public access for subscription_plans" ON subscription_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for platform_settings" ON platform_settings;
CREATE POLICY "Public access for platform_settings" ON platform_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for trial_records" ON trial_records;
CREATE POLICY "Public access for trial_records" ON trial_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for landing_page_content" ON landing_page_content;
CREATE POLICY "Public access for landing_page_content" ON landing_page_content FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- HABILITAR REALTIME NO SUPABASE (SE DISPONÍVEL)
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE barbershops;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE platform_settings;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE landing_page_content;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE trial_records;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- ============================================================
-- RECARREGAR SCHEMA CACHE DO POSTGREST IMEDIATAMENTE
-- ============================================================
NOTIFY pgrst, 'reload schema';
`;

// ----------------------------------------------------
// SQL Script dedicado exclusivamente à Apresentação & Configurações
// ----------------------------------------------------
export const LANDING_PAGE_SQL_SCHEMA = `-- ============================================================
-- BARBERCLOCK - TABELAS DE APRESENTAÇÃO E CONFIGURAÇÕES
-- Execute este script no SQL Editor do Supabase para criar/atualizar
-- especificamente as tabelas de Apresentação (Landing Page):
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. GARANTIR PERMISSÕES
GRANT ALL ON SCHEMA public TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated;

-- 2. TABELA DE CONTEÚDO DA LANDING PAGE (landing_page_content)
CREATE TABLE IF NOT EXISTS landing_page_content (
  id TEXT PRIMARY KEY DEFAULT 'current',
  brand_logo_url TEXT DEFAULT '',
  hero_tag TEXT DEFAULT '',
  hero_title TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  hero_cta_text TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  video_title TEXT DEFAULT '',
  video_description TEXT DEFAULT '',
  video_poster_url TEXT DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  testimonials JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  cta_title TEXT DEFAULT '',
  cta_subtitle TEXT DEFAULT '',
  cta_button_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrações idempotentes para garantir todas as colunas
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS brand_logo_url TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_tag TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS hero_cta_text TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_title TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_description TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS video_poster_url TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS cta_title TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS cta_subtitle TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS cta_button_text TEXT DEFAULT '';
ALTER TABLE landing_page_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. TABELA DE CONFIGURAÇÕES DA PLATAFORMA (platform_settings)
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  platform_name TEXT DEFAULT 'BarberClock',
  platform_logo_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  platform_pix_key TEXT DEFAULT '',
  platform_pix_key_type TEXT DEFAULT 'phone',
  platform_pix_receiver_name TEXT DEFAULT '',
  monthly_fee NUMERIC DEFAULT 49.90,
  support_phone TEXT DEFAULT '',
  support_email TEXT DEFAULT '',
  pix_instructions TEXT DEFAULT '',
  mercado_pago_access_token TEXT DEFAULT '',
  mercado_pago_public_key TEXT DEFAULT '',
  mercado_pago_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT 'BarberClock';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_logo_url TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_pix_key TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_pix_key_type TEXT DEFAULT 'phone';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS platform_pix_receiver_name TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 49.90;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS pix_instructions TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS mercado_pago_access_token TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS mercado_pago_public_key TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS mercado_pago_enabled BOOLEAN DEFAULT false;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. INSERÇÃO DO REGISTRO INICIAL (caso não exista)
INSERT INTO landing_page_content (id, hero_title, hero_subtitle, hero_cta_text)
VALUES ('current', 'O Sistema de Agendamento Definitivo para a sua Barbearia', 'Aumente seus agendamentos, elimine faltas e receba pagamentos via PIX e Mercado Pago automaticamente.', 'Começar Teste Grátis de 30 Dias')
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform_settings (id, platform_name)
VALUES ('current', 'BarberClock')
ON CONFLICT (id) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for landing_page_content" ON landing_page_content;
CREATE POLICY "Public access for landing_page_content" ON landing_page_content FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for platform_settings" ON platform_settings;
CREATE POLICY "Public access for platform_settings" ON platform_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. PUBLICAR NO REALTIME (se disponível)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE landing_page_content;
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE platform_settings;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

NOTIFY pgrst, 'reload schema';
`;


// ----------------------------------------------------
// Data Mappers (DB Snake_Case <-> App CamelCase)
// ----------------------------------------------------
function mapBarbershopFromDb(row: any): Barbershop {
  const acceptedMethods = safeParseArray(row.accepted_payment_methods);
  return {
    id: row.id,
    ownerId: row.owner_id || '',
    ownerName: row.owner_name || '',
    ownerPhone: row.owner_phone || '',
    name: row.name || '',
    slug: row.slug || '',
    logoUrl: row.logo_url || '',
    bannerUrl: row.banner_url || '',
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    instagram: row.instagram || '',
    bio: row.bio || '',
    themeColor: row.theme_color || '#d97706',
    pixKey: row.pix_key || '',
    pixKeyType: row.pix_key_type || 'phone',
    pixReceiverName: row.pix_receiver_name || '',
    mercadoPagoAccessToken: row.mercado_pago_access_token || '',
    mercadoPagoPublicKey: row.mercado_pago_public_key || '',
    mercadoPagoEnabled: Boolean(row.mercado_pago_enabled),
    subscriptionPlanId: row.subscription_plan_id || 'trial',
    subscriptionStatus: row.subscription_status || 'active',
    subscriptionMonthlyFee: Number(row.subscription_monthly_fee) || 49.9,
    subscriptionValidUntil: row.subscription_valid_until || '',
    subscriptionProofUrl: row.subscription_proof_url || undefined,
    subscriptionRequestedAt: row.subscription_requested_at || '',
    subscriptionLastPaymentDate: row.subscription_last_payment_date || undefined,
    workingHours: row.working_hours || {},
    slotIntervalMinutes: Number(row.slot_interval_minutes) || 30,
    bookingWindowDays: Number(row.booking_window_days) || 30,
    confirmationMode: row.confirmation_mode || 'pix',
    acceptedPaymentMethods: acceptedMethods.length > 0 ? acceptedMethods : ['pix_manual', 'cash', 'card'],
  };
}

function mapBarbershopToDb(shop: Barbershop): any {
  return {
    id: shop.id,
    owner_id: shop.ownerId,
    owner_name: shop.ownerName,
    owner_phone: shop.ownerPhone,
    name: shop.name,
    slug: shop.slug,
    logo_url: shop.logoUrl,
    banner_url: shop.bannerUrl,
    phone: shop.phone,
    address: shop.address,
    city: shop.city,
    instagram: shop.instagram,
    bio: shop.bio,
    theme_color: shop.themeColor,
    pix_key: shop.pixKey,
    pix_key_type: shop.pixKeyType,
    pix_receiver_name: shop.pixReceiverName,
    mercado_pago_access_token: shop.mercadoPagoAccessToken || '',
    mercado_pago_public_key: shop.mercadoPagoPublicKey || '',
    mercado_pago_enabled: Boolean(shop.mercadoPagoEnabled),
    subscription_plan_id: shop.subscriptionPlanId || 'trial',
    subscription_status: shop.subscriptionStatus || 'active',
    subscription_monthly_fee: shop.subscriptionMonthlyFee || 49.9,
    subscription_valid_until: shop.subscriptionValidUntil || '',
    subscription_proof_url: shop.subscriptionProofUrl || '',
    subscription_requested_at: shop.subscriptionRequestedAt || '',
    subscription_last_payment_date: shop.subscriptionLastPaymentDate || '',
    working_hours: shop.workingHours || {},
    slot_interval_minutes: shop.slotIntervalMinutes || 30,
    booking_window_days: shop.bookingWindowDays || 30,
    confirmation_mode: shop.confirmationMode || 'pix',
    accepted_payment_methods: safeParseArray(shop.acceptedPaymentMethods || ['pix_manual', 'cash', 'card']),
    updated_at: new Date().toISOString(),
  };
}

function mapServiceFromDb(row: any): Service {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price) || 0,
    durationMinutes: Number(row.duration_minutes) || 30,
    category: row.category || 'cabelo',
    active: row.active !== false,
    iconName: row.icon_name || undefined,
  };
}

function mapServiceToDb(srv: Service): any {
  return {
    id: srv.id,
    barbershop_id: srv.barbershopId,
    name: srv.name,
    description: srv.description || '',
    price: srv.price,
    duration_minutes: srv.durationMinutes,
    category: srv.category,
    active: srv.active,
    icon_name: srv.iconName || '',
  };
}

function mapAppointmentFromDb(row: any): Appointment {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    barberName: row.barber_name,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    serviceId: row.service_id,
    serviceName: row.service_name,
    servicePrice: Number(row.service_price) || 0,
    durationMinutes: Number(row.duration_minutes) || 30,
    date: row.date,
    time: row.time,
    status: row.status,
    pixKeyUsed: row.pix_key_used || '',
    pixTransactionCode: row.pix_transaction_code || '',
    pixPaidAt: row.pix_paid_at || undefined,
    pixProofUrl: row.pix_proof_url || undefined,
    mercadoPagoPaymentId: row.mercado_pago_payment_id || undefined,
    notes: row.notes || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    cancelledBy: row.cancelled_by || undefined,
    cancelledAt: row.cancelled_at || undefined,
    paymentMethod: row.payment_method || 'pix_manual',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAppointmentToDb(apt: Appointment): any {
  return {
    id: apt.id,
    barbershop_id: apt.barbershopId,
    barber_name: apt.barberName,
    client_name: apt.clientName,
    client_phone: apt.clientPhone,
    service_id: apt.serviceId,
    service_name: apt.serviceName,
    service_price: apt.servicePrice,
    duration_minutes: apt.durationMinutes,
    date: apt.date,
    time: apt.time,
    status: apt.status,
    pix_key_used: apt.pixKeyUsed || '',
    pix_transaction_code: apt.pixTransactionCode || '',
    pix_paid_at: apt.pixPaidAt || '',
    pix_proof_url: apt.pixProofUrl || '',
    mercado_pago_payment_id: apt.mercadoPagoPaymentId || '',
    notes: apt.notes || '',
    cancellation_reason: apt.cancellationReason || '',
    cancelled_by: apt.cancelledBy || '',
    cancelled_at: apt.cancelledAt || '',
    payment_method: apt.paymentMethod || 'pix_manual',
    created_at: apt.createdAt || new Date().toISOString(),
  };
}

function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    password: row.password || undefined,
    role: row.role || 'client',
    barbershopId: row.barbershop_id || undefined,
    avatarUrl: row.avatar_url || undefined,
  };
}

function mapUserToDb(u: User): any {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email || '',
    password: u.password || '',
    role: u.role,
    barbershop_id: u.barbershopId || '',
    avatar_url: u.avatarUrl || '',
  };
}

// Helper to safely parse array fields that might be arrays or stringified JSON from Postgres
function safeParseArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function mapPlanFromDb(row: any): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    periodMonths: Number(row.period_months) || 1,
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    monthlyEquivalent: Number(row.monthly_equivalent) || 0,
    discountPercent: row.discount_percent ? Number(row.discount_percent) : 0,
    description: row.description || '',
    badge: row.badge || undefined,
    isPopular: Boolean(row.is_popular),
    features: safeParseArray(row.features),
    active: row.active !== false,
  };
}

function mapPlanToDb(p: SubscriptionPlan): any {
  return {
    id: p.id,
    name: p.name,
    period_months: p.periodMonths,
    price: p.price,
    original_price: p.originalPrice || null,
    monthly_equivalent: p.monthlyEquivalent,
    discount_percent: p.discountPercent || 0,
    description: p.description || '',
    badge: p.badge || '',
    is_popular: Boolean(p.isPopular),
    features: safeParseArray(p.features),
    active: p.active,
    updated_at: new Date().toISOString(),
  };
}

function mapSettingsFromDb(row: any): PlatformSettings {
  const logo = row.platform_logo_url || row.logo_url || '/barber_clock_logo.jpg';
  return {
    platformName: row.platform_name || row.platformName || 'BarberClock',
    platformLogoUrl: logo,
    logoUrl: logo,
    platformPixKey: row.platform_pix_key || row.platformPixKey || '',
    platformPixKeyType: row.platform_pix_key_type || row.platformPixKeyType || 'phone',
    platformPixReceiverName: row.platform_pix_receiver_name || row.platformPixReceiverName || '',
    monthlyFee: Number(row.monthly_fee ?? row.monthlyFee) || 49.9,
    supportPhone: row.support_phone || row.supportPhone || '',
    supportEmail: row.support_email || row.supportEmail || '',
    pixInstructions: row.pix_instructions || row.pixInstructions || '',
    mercadoPagoAccessToken: row.mercado_pago_access_token || row.mercadoPagoAccessToken || '',
    mercadoPagoPublicKey: row.mercado_pago_public_key || row.mercadoPagoPublicKey || '',
    mercadoPagoEnabled: Boolean(row.mercado_pago_enabled ?? row.mercadoPagoEnabled),
  };
}

function mapSettingsToDb(s: PlatformSettings): any {
  const logo = s.platformLogoUrl || s.logoUrl || '';
  return {
    id: 'current',
    platform_name: s.platformName || 'BarberClock',
    platform_logo_url: logo,
    logo_url: logo,
    platform_pix_key: s.platformPixKey || '',
    platform_pix_key_type: s.platformPixKeyType || 'phone',
    platform_pix_receiver_name: s.platformPixReceiverName || '',
    monthly_fee: Number(s.monthlyFee) || 49.9,
    support_phone: s.supportPhone || '',
    support_email: s.supportEmail || '',
    pix_instructions: s.pixInstructions || '',
    mercado_pago_access_token: s.mercadoPagoAccessToken || '',
    mercado_pago_public_key: s.mercadoPagoPublicKey || '',
    mercado_pago_enabled: Boolean(s.mercadoPagoEnabled),
    updated_at: new Date().toISOString(),
  };
}

function mapTrialFromDb(row: any): TrialUserRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    barbershopId: row.barbershop_id || undefined,
    barbershopName: row.barbershop_name || undefined,
    registeredAt: row.registered_at || new Date().toISOString(),
  };
}

function mapTrialToDb(t: TrialUserRecord): any {
  return {
    id: t.id,
    name: t.name,
    phone: t.phone,
    email: t.email || '',
    barbershop_id: t.barbershopId || '',
    barbershop_name: t.barbershopName || '',
    registered_at: t.registeredAt,
  };
}

function mapLandingFromDb(row: any): LandingPageContent {
  if (!row) return INITIAL_LANDING_CONTENT;
  const feats = safeParseArray(row.features);
  const gals = safeParseArray(row.gallery_images);
  const sts = safeParseArray(row.stats);
  const tests = safeParseArray(row.testimonials);
  const fqs = safeParseArray(row.faqs);

  return {
    brandLogoUrl:
      row.brand_logo_url !== undefined && row.brand_logo_url !== null && row.brand_logo_url !== ''
        ? row.brand_logo_url
        : (INITIAL_LANDING_CONTENT.brandLogoUrl || '/barber_clock_logo.jpg'),
    heroTag: row.hero_tag !== undefined && row.hero_tag !== null ? row.hero_tag : INITIAL_LANDING_CONTENT.heroTag,
    heroTitle:
      row.hero_title !== undefined && row.hero_title !== null && row.hero_title !== ''
        ? row.hero_title
        : INITIAL_LANDING_CONTENT.heroTitle,
    heroSubtitle:
      row.hero_subtitle !== undefined && row.hero_subtitle !== null && row.hero_subtitle !== ''
        ? row.hero_subtitle
        : INITIAL_LANDING_CONTENT.heroSubtitle,
    heroCtaText:
      row.hero_cta_text !== undefined && row.hero_cta_text !== null && row.hero_cta_text !== ''
        ? row.hero_cta_text
        : INITIAL_LANDING_CONTENT.heroCtaText,
    videoUrl:
      row.video_url !== undefined && row.video_url !== null && row.video_url !== ''
        ? row.video_url
        : INITIAL_LANDING_CONTENT.videoUrl,
    videoTitle:
      row.video_title !== undefined && row.video_title !== null && row.video_title !== ''
        ? row.video_title
        : INITIAL_LANDING_CONTENT.videoTitle,
    videoDescription:
      row.video_description !== undefined && row.video_description !== null && row.video_description !== ''
        ? row.video_description
        : INITIAL_LANDING_CONTENT.videoDescription,
    videoPosterUrl:
      row.video_poster_url !== undefined && row.video_poster_url !== null
        ? row.video_poster_url
        : INITIAL_LANDING_CONTENT.videoPosterUrl,
    features: Array.isArray(feats) && feats.length > 0 ? feats : INITIAL_LANDING_CONTENT.features,
    galleryImages: Array.isArray(gals) && gals.length > 0 ? gals : INITIAL_LANDING_CONTENT.galleryImages,
    stats: Array.isArray(sts) && sts.length > 0 ? sts : INITIAL_LANDING_CONTENT.stats,
    testimonials: Array.isArray(tests) && tests.length > 0 ? tests : INITIAL_LANDING_CONTENT.testimonials,
    faqs: Array.isArray(fqs) && fqs.length > 0 ? fqs : INITIAL_LANDING_CONTENT.faqs,
    ctaTitle:
      row.cta_title !== undefined && row.cta_title !== null && row.cta_title !== ''
        ? row.cta_title
        : INITIAL_LANDING_CONTENT.ctaTitle,
    ctaSubtitle:
      row.cta_subtitle !== undefined && row.cta_subtitle !== null && row.cta_subtitle !== ''
        ? row.cta_subtitle
        : INITIAL_LANDING_CONTENT.ctaSubtitle,
    ctaButtonText:
      row.cta_button_text !== undefined && row.cta_button_text !== null && row.cta_button_text !== ''
        ? row.cta_button_text
        : INITIAL_LANDING_CONTENT.ctaButtonText,
  };
}

function mapLandingToDb(l: LandingPageContent): any {
  return {
    id: 'current',
    brand_logo_url: l.brandLogoUrl || '',
    hero_tag: l.heroTag || '',
    hero_title: l.heroTitle || '',
    hero_subtitle: l.heroSubtitle || '',
    hero_cta_text: l.heroCtaText || '',
    video_url: l.videoUrl || '',
    video_title: l.videoTitle || '',
    video_description: l.videoDescription || '',
    video_poster_url: l.videoPosterUrl || '',
    features: safeParseArray(l.features),
    gallery_images: safeParseArray(l.galleryImages),
    stats: safeParseArray(l.stats),
    testimonials: safeParseArray(l.testimonials),
    faqs: safeParseArray(l.faqs),
    cta_title: l.ctaTitle || '',
    cta_subtitle: l.ctaSubtitle || '',
    cta_button_text: l.ctaButtonText || '',
    updated_at: new Date().toISOString(),
  };
}

// ----------------------------------------------------
// Server Backend DB Helpers
// ----------------------------------------------------
export async function saveToServerDb(table: string, data: any, action: 'upsert' | 'delete' = 'upsert') {
  try {
    await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, data, action }),
    });
  } catch (e) {
    console.warn('Server DB save error:', e);
  }
}

export async function fetchServerDbData() {
  try {
    const res = await fetch('/api/db/data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch server DB data:', e);
  }
  return null;
}

export async function syncAllToServerDb(allData: any) {
  try {
    await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allData),
    });
  } catch (e) {
    console.warn('Server DB sync error:', e);
  }
}

// ----------------------------------------------------
// CRUD Service & Realtime
// ----------------------------------------------------
export const supabaseService = {
  // Test connection & tables (Backend Server test with direct fallback)
  async checkConnection(): Promise<{ connected: boolean; message: string; tablesCount?: number }> {
    const config = getStoredSupabaseConfig();
    const cleanUrl = normalizeSupabaseUrl(config.url);
    const key = config.key;

    if (!cleanUrl || !key) {
      return {
        connected: false,
        message: 'Supabase não inicializado. Verifique a URL e a Chave Anon.',
      };
    }

    // 1. Check via Server Backend (Bypasses browser CORS & ad-blockers)
    try {
      const serverRes = await fetch(`/api/supabase/status?url=${encodeURIComponent(cleanUrl)}&key=${encodeURIComponent(key)}`);
      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json.connected) {
          return {
            connected: true,
            message: json.message || 'Conectado com sucesso ao Supabase!',
          };
        } else if (json.message) {
          return {
            connected: false,
            message: json.message,
          };
        }
      }
    } catch {
      // Backend test endpoint had a network hiccup, fallback to direct client test
    }

    // 2. Direct client fallback
    const client = getSupabaseClient();
    if (!client) {
      return {
        connected: false,
        message: 'Supabase não inicializado. Verifique a URL e a Chave Anon.',
      };
    }

    try {
      const startTime = Date.now();
      const { error: barberErr } = await client.from('barbershops').select('id').limit(1);
      const elapsed = Date.now() - startTime;

      if (barberErr) {
        if (barberErr.code === '42P01' || barberErr.message.includes('does not exist') || barberErr.message.includes('relation')) {
          return {
            connected: false,
            message: 'Tabelas não encontradas no Supabase. Execute o script SQL no menu SQL Editor do seu painel Supabase.',
          };
        }
        return {
          connected: false,
          message: `Erro ao conectar: ${barberErr.message} (Código: ${barberErr.code || 'n/a'})`,
        };
      }

      return {
        connected: true,
        message: `Conectado com sucesso em ${elapsed}ms! Banco de dados operacional.`,
      };
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        return {
          connected: false,
          message:
            'Não foi possível alcançar o servidor Supabase diretamente. Certifique-se de executar o script SQL no SQL Editor do Supabase.',
        };
      }
      return {
        connected: false,
        message: `Falha na requisição: ${msg}`,
      };
    }
  },

  // 1. Barbershops
  async getBarbershops(): Promise<Barbershop[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('barbershops').select('*');
      if (error || !data) return null;
      return data.map(mapBarbershopFromDb);
    } catch (e) {
      console.warn('Supabase getBarbershops error:', e);
      return null;
    }
  },

  async upsertBarbershop(shop: Barbershop): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('barbershops', shop, 'upsert');

    const mapped = mapBarbershopToDb(shop);

    // Try server-side proxy first (bypasses browser CORS / adblocker / network issues)
    try {
      const config = getStoredSupabaseConfig();
      const cleanUrl = normalizeSupabaseUrl(config.url);
      const key = config.key;
      if (cleanUrl && key) {
        fetch('/api/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barbershops: [mapped],
            customUrl: cleanUrl,
            customKey: key,
          }),
        }).catch((err) => console.warn('Background backend sync for barbershop failed:', err));
      }
    } catch {}

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('barbershops').upsert(mapped);
      if (error) console.warn('upsertBarbershop error:', error);
      return !error;
    } catch (e) {
      console.warn('Supabase upsertBarbershop exception:', e);
      return false;
    }
  },

  async deleteBarbershop(id: string): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('barbershops', { id }, 'delete');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('barbershops').delete().eq('id', id);
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 2. Services
  async getServices(): Promise<Service[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('services').select('*');
      if (error || !data) return null;
      return data.map(mapServiceFromDb);
    } catch (e) {
      console.warn('Supabase getServices error:', e);
      return null;
    }
  },

  async upsertService(srv: Service): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('services', srv, 'upsert');

    const mapped = mapServiceToDb(srv);

    try {
      const config = getStoredSupabaseConfig();
      const cleanUrl = normalizeSupabaseUrl(config.url);
      const key = config.key;
      if (cleanUrl && key) {
        fetch('/api/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            services: [mapped],
            customUrl: cleanUrl,
            customKey: key,
          }),
        }).catch((err) => console.warn('Background backend sync for service failed:', err));
      }
    } catch {}

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('services').upsert(mapped);
      if (error) console.warn('upsertService error:', error);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async deleteService(id: string): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('services', { id }, 'delete');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('services').delete().eq('id', id);
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 3. Appointments
  async getAppointments(): Promise<Appointment[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map(mapAppointmentFromDb);
    } catch (e) {
      console.warn('Supabase getAppointments error:', e);
      return null;
    }
  },

  async upsertAppointment(apt: Appointment): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('appointments', apt, 'upsert');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('appointments').upsert(mapAppointmentToDb(apt));
      if (error) console.warn('upsertAppointment error:', error);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async deleteAppointment(id: string): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('appointments', { id }, 'delete');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('appointments').delete().eq('id', id);
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 4. Users
  async getUsers(): Promise<User[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('users').select('*');
      if (error || !data) return null;
      return data.map(mapUserFromDb);
    } catch (e) {
      console.warn('Supabase getUsers error:', e);
      return null;
    }
  },

  async upsertUser(user: User): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('users', user, 'upsert');

    const mapped = mapUserToDb(user);

    try {
      const config = getStoredSupabaseConfig();
      const cleanUrl = normalizeSupabaseUrl(config.url);
      const key = config.key;
      if (cleanUrl && key) {
        fetch('/api/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            users: [mapped],
            customUrl: cleanUrl,
            customKey: key,
          }),
        }).catch((err) => console.warn('Background backend sync for user failed:', err));
      }
    } catch {}

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('users').upsert(mapped);
      if (error) console.warn('upsertUser error:', error);
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 5. Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('subscription_plans').select('*');
      if (error || !data) return null;
      return data.map(mapPlanFromDb);
    } catch (e) {
      console.warn('Supabase getSubscriptionPlans error:', e);
      return null;
    }
  },

  async upsertSubscriptionPlan(plan: SubscriptionPlan): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('plans', plan, 'upsert');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('subscription_plans').upsert(mapPlanToDb(plan));
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 6. Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('platform_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return mapSettingsFromDb(data);
    } catch (e) {
      return null;
    }
  },

  async upsertPlatformSettings(settings: PlatformSettings): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('settings', settings, 'upsert');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client
        .from('platform_settings')
        .upsert(mapSettingsToDb(settings));
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 7. Trial Records
  async getTrialRecords(): Promise<TrialUserRecord[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('trial_records').select('*');
      if (error || !data) return null;
      return data.map(mapTrialFromDb);
    } catch (e) {
      return null;
    }
  },

  async upsertTrialRecord(record: TrialUserRecord): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('trialRecords', record, 'upsert');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const { error } = await client.from('trial_records').upsert(mapTrialToDb(record));
      return !error;
    } catch (e) {
      return false;
    }
  },

  // 8. Landing Page Content
  async getLandingPageContent(): Promise<LandingPageContent | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('landing_page_content')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('Supabase getLandingPageContent error:', error);
        return null;
      }
      if (!data) return null;
      return mapLandingFromDb(data);
    } catch (e) {
      console.warn('Supabase getLandingPageContent catch error:', e);
      return null;
    }
  },

  async upsertLandingPageContent(content: LandingPageContent): Promise<boolean> {
    // Always persist to server database file
    saveToServerDb('landing', content, 'upsert');

    const client = getSupabaseClient();
    if (!client) return true;
    try {
      const mapped = mapLandingToDb(content);
      const { error } = await client
        .from('landing_page_content')
        .upsert(mapped, { onConflict: 'id' });
      if (error) {
        console.warn('upsertLandingPageContent error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('upsertLandingPageContent catch error:', e);
      return false;
    }
  },

  // Sincronização direta e dedicada apenas da Apresentação para o Supabase
  async syncLandingOnlyToSupabase(content: LandingPageContent): Promise<{ success: boolean; message: string }> {
    const config = getStoredSupabaseConfig();
    const cleanUrl = normalizeSupabaseUrl(config.url);
    const key = config.key;

    if (!cleanUrl || !key) {
      return { success: false, message: 'Supabase não configurado. Verifique a URL e a Chave Anon.' };
    }

    // 1. Tenta via endpoint do servidor (imune a CORS e bloqueadores)
    try {
      const mapped = mapLandingToDb(content);
      const res = await fetch('/api/supabase/sync-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing: mapped,
          customUrl: cleanUrl,
          customKey: key,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        return {
          success: true,
          message: json.message || 'Configurações de apresentação sincronizadas com o Supabase!',
        };
      } else if (json?.message) {
        return { success: false, message: json.message };
      }
    } catch (err) {
      console.warn('Backend sync-landing request failed, trying direct client:', err);
    }

    // 2. Fallback direto pelo cliente Supabase
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Cliente Supabase offline ou não configurado.' };
    }

    try {
      const mapped = mapLandingToDb(content);
      const { error } = await client
        .from('landing_page_content')
        .upsert(mapped, { onConflict: 'id' });

      if (error) {
        let msg = error.message;
        if (msg.includes('42P01') || msg.includes('does not exist') || msg.includes('relation')) {
          msg = 'A tabela "landing_page_content" não foi encontrada. Copie o script SQL da Apresentação e rode no SQL Editor do Supabase.';
        }
        return { success: false, message: `Erro ao sincronizar: ${msg}` };
      }

      return {
        success: true,
        message: 'Apresentação gravada e sincronizada no Supabase com sucesso!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha na sincronização: ${err?.message || 'Erro de conexão'}`,
      };
    }
  },

  // Seed / Sync all initial data to Supabase (uses backend sync route to eliminate CORS/browser fetch failures)
  async seedAllToSupabase(allData: {
    barbershops: Barbershop[];
    services: Service[];
    appointments: Appointment[];
    users: User[];
    plans: SubscriptionPlan[];
    settings: PlatformSettings;
    trialRecords: TrialUserRecord[];
    landing: LandingPageContent;
  }): Promise<{ success: boolean; message: string }> {
    const config = getStoredSupabaseConfig();
    const cleanUrl = normalizeSupabaseUrl(config.url);
    const key = config.key;

    if (!cleanUrl || !key) {
      return { success: false, message: 'Supabase não configurado. Verifique a URL e a Chave Anon.' };
    }

    // 1. Try Backend Sync Route (Completely immune to browser CORS, iframe and ad-blocker issues)
    try {
      const payload = {
        barbershops: allData.barbershops.map(mapBarbershopToDb),
        services: allData.services.map(mapServiceToDb),
        appointments: allData.appointments.map(mapAppointmentToDb),
        users: allData.users.map(mapUserToDb),
        plans: allData.plans.map(mapPlanToDb),
        settings: mapSettingsToDb(allData.settings),
        trialRecords: allData.trialRecords.map(mapTrialToDb),
        landing: mapLandingToDb(allData.landing),
        customUrl: cleanUrl,
        customKey: key,
      };

      const serverRes = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await serverRes.json().catch(() => null);
      if (serverRes.ok && json?.success) {
        return {
          success: true,
          message: json.message || 'Todos os dados foram sincronizados com o Supabase com sucesso!',
        };
      } else if (json?.message) {
        return {
          success: false,
          message: json.message,
        };
      }
    } catch (err: any) {
      console.warn('Backend sync request failed, trying client fallback:', err);
    }

    // 2. Direct client fallback
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase não configurado ou cliente offline.' };
    }

    try {
      if (allData.barbershops.length > 0) {
        const rows = allData.barbershops.map(mapBarbershopToDb);
        const { error } = await client.from('barbershops').upsert(rows);
        if (error) throw new Error(`Barbearias: ${error.message}`);
      }

      if (allData.services.length > 0) {
        const rows = allData.services.map(mapServiceToDb);
        const { error } = await client.from('services').upsert(rows);
        if (error) throw new Error(`Serviços: ${error.message}`);
      }

      if (allData.appointments.length > 0) {
        const rows = allData.appointments.map(mapAppointmentToDb);
        const { error } = await client.from('appointments').upsert(rows);
        if (error) throw new Error(`Agendamentos: ${error.message}`);
      }

      if (allData.users.length > 0) {
        const rows = allData.users.map(mapUserToDb);
        const { error } = await client.from('users').upsert(rows);
        if (error) throw new Error(`Usuários: ${error.message}`);
      }

      if (allData.plans.length > 0) {
        const rows = allData.plans.map(mapPlanToDb);
        const { error } = await client.from('subscription_plans').upsert(rows);
        if (error) throw new Error(`Planos: ${error.message}`);
      }

      await client.from('platform_settings').upsert(mapSettingsToDb(allData.settings));

      if (allData.trialRecords.length > 0) {
        const rows = allData.trialRecords.map(mapTrialToDb);
        await client.from('trial_records').upsert(rows);
      }

      await client.from('landing_page_content').upsert(mapLandingToDb(allData.landing));

      return {
        success: true,
        message: 'Todos os dados foram sincronizados com o Supabase com sucesso!',
      };
    } catch (err: any) {
      const msg = err?.message || '';
      let friendlyMessage = msg;
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        friendlyMessage =
          'Falha de rede ao contactar o Supabase. Verifique se o projeto não está Pausado e se executou o script SQL no SQL Editor do Supabase.';
      } else if (msg.includes('42P01') || msg.includes('does not exist') || msg.includes('relation')) {
        friendlyMessage =
          'Tabelas não encontradas no Supabase. Copie o script SQL na aba "Script SQL" e execute no SQL Editor do Supabase antes de sincronizar.';
      }

      return {
        success: false,
        message: `Falha na sincronização: ${friendlyMessage}`,
      };
    }
  },

  // Realtime subscription listener
  subscribeToChanges(
    onAppointmentsChange: () => void,
    onBarbershopsChange: () => void,
    onServicesChange: () => void,
    onPlatformSettingsChange?: () => void,
    onLandingContentChange?: () => void,
    onPlansChange?: () => void
  ) {
    const client = getSupabaseClient();
    if (!client) return () => {};

    try {
      let channel = client
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => onAppointmentsChange()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'barbershops' },
          () => onBarbershopsChange()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'services' },
          () => onServicesChange()
        );

      if (onPlatformSettingsChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'platform_settings' },
          () => onPlatformSettingsChange()
        );
      }

      if (onLandingContentChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'landing_page_content' },
          () => onLandingContentChange()
        );
      }

      if (onPlansChange) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subscription_plans' },
          () => onPlansChange()
        );
      }

      channel.subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Erro ao assinar canal realtime Supabase:', err);
      return () => {};
    }
  },
};

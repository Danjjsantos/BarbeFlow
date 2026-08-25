-- ============================================================
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
  mercado_pago_payment_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  cancellation_reason TEXT DEFAULT '',
  cancelled_by TEXT DEFAULT '',
  cancelled_at TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'pix',
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
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix';
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
END $$;

-- ============================================================
-- RECARREGAR SCHEMA CACHE DO POSTGREST IMEDIATAMENTE
-- ============================================================
NOTIFY pgrst, 'reload schema';



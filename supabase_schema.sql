-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE - PLATAFORMA SAAS BARBEARIAS
-- ==============================================================================
-- Instruções:
-- 1. Acesse seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique em "SQL Editor" -> "New Query"
-- 3. Cole todo o conteúdo deste arquivo e clique no botão "RUN" (ou Ctrl + Enter)
-- 4. Todas as tabelas, índices, políticas de segurança (RLS) e dados iniciais
--    serão criados automaticamente.
-- ==============================================================================

-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA DE BARBEARIAS (barbershops)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.barbershops (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    instagram TEXT,
    bio TEXT,
    theme_color TEXT DEFAULT '#d97706',
    pix_key TEXT,
    pix_key_type TEXT DEFAULT 'cpf', -- 'cpf', 'cnpj', 'email', 'phone', 'random'
    pix_receiver_name TEXT,
    subscription_plan_id TEXT DEFAULT 'monthly',
    subscription_status TEXT DEFAULT 'active', -- 'active', 'pending', 'overdue', 'trial', 'blocked'
    subscription_monthly_fee NUMERIC(10, 2) DEFAULT 49.90,
    subscription_valid_until DATE,
    subscription_proof_url TEXT,
    subscription_requested_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_last_payment_date DATE,
    working_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"19:00","closed":false},"tuesday":{"open":"09:00","close":"19:00","closed":false},"wednesday":{"open":"09:00","close":"19:00","closed":false},"thursday":{"open":"09:00","close":"19:00","closed":false},"friday":{"open":"09:00","close":"20:00","closed":false},"saturday":{"open":"08:30","close":"18:00","closed":false},"sunday":{"open":"09:00","close":"13:00","closed":true}}'::jsonb,
    slot_interval_minutes INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. TABELA DE SERVIÇOS (services)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    barbershop_id TEXT NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 30,
    category TEXT DEFAULT 'cabelo', -- 'cabelo', 'barba', 'combo', 'quimica', 'outros'
    active BOOLEAN DEFAULT TRUE,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABELA DE AGENDAMENTOS (appointments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    barbershop_id TEXT NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    barber_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    service_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 30,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending_pix', 'confirmed', 'completed', 'cancelled'
    pix_key_used TEXT,
    pix_transaction_code TEXT,
    pix_paid_at TIMESTAMPTZ,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by TEXT, -- 'client', 'barber', 'system'
    cancelled_at TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'pix',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABELA DE USUÁRIOS (users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'client', -- 'super_admin', 'barber', 'client'
    barbershop_id TEXT REFERENCES public.barbershops(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABELA DE PLANOS DE ASSINATURA SAAS (subscription_plans)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    period_months INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    monthly_equivalent NUMERIC(10, 2) NOT NULL,
    discount_percent INT DEFAULT 0,
    description TEXT,
    badge TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABELA DE CONFIGURAÇÕES GERAIS DA PLATAFORMA (platform_settings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    platform_name TEXT NOT NULL DEFAULT 'BarberHub Brasil',
    platform_pix_key TEXT NOT NULL,
    platform_pix_key_type TEXT NOT NULL DEFAULT 'email',
    platform_pix_receiver_name TEXT NOT NULL,
    monthly_fee NUMERIC(10, 2) DEFAULT 49.90,
    support_phone TEXT,
    support_email TEXT,
    pix_instructions TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABELA DE CONTEÚDO DA LANDING PAGE (landing_content)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.landing_content (
    id TEXT PRIMARY KEY DEFAULT 'main_landing',
    hero_tag TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_cta_text TEXT,
    video_url TEXT,
    video_title TEXT,
    video_description TEXT,
    video_poster_url TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    testimonials JSONB DEFAULT '[]'::jsonb,
    faq JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '[]'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE OTIMIZAÇÃO (SEARCH & REALTIME PERFORMANCE)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_barbershops_slug ON public.barbershops(slug);
CREATE INDEX IF NOT EXISTS idx_barbershops_owner_phone ON public.barbershops(owner_phone);
CREATE INDEX IF NOT EXISTS idx_barbershops_subscription_status ON public.barbershops(subscription_status);
CREATE INDEX IF NOT EXISTS idx_services_barbershop_id ON public.services(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_date ON public.appointments(barbershop_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON public.appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ==============================================================================
-- SEGURANÇA E POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público (Anon Key do Supabase)
DROP POLICY IF EXISTS "Acesso total publico para barbershops" ON public.barbershops;
CREATE POLICY "Acesso total publico para barbershops" ON public.barbershops FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico para services" ON public.services;
CREATE POLICY "Acesso total publico para services" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico para appointments" ON public.appointments;
CREATE POLICY "Acesso total publico para appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico para users" ON public.users;
CREATE POLICY "Acesso total publico para users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico para subscription_plans" ON public.subscription_plans;
CREATE POLICY "Acesso total publico para subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico para platform_settings" ON public.platform_settings;
CREATE POLICY "Acesso total publico para platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total publico para landing_content" ON public.landing_content;
CREATE POLICY "Acesso total publico para landing_content" ON public.landing_content FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- HABILITAR REALTIME VIA WEBSOCKETS (SUPABASE REALTIME)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'appointments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'barbershops') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.barbershops;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'services') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    END IF;
END $$;

-- ==============================================================================
-- DADOS INICIAIS (SEED DATA - INSERÇÃO AUTOMÁTICA SEGURA)
-- ==============================================================================

-- 1. Planos de Assinatura
INSERT INTO public.subscription_plans (id, name, period_months, price, original_price, monthly_equivalent, discount_percent, description, badge, is_popular, active, features)
VALUES
('monthly', 'Plano Mensal', 1, 49.90, NULL, 49.90, 0, 'Ideal para barbearias individuais que desejam flexibilidade sem compromisso de longo prazo.', 'Sem Fidelidade', FALSE, TRUE, '["Agenda pública online 24h para seus clientes", "Recebimento direto via PIX na sua chave", "Painel financeiro de faturamento em tempo real", "Catálogo ilimitado de serviços e preços", "QR Code de balcão e link personalizado", "Suporte via WhatsApp em horário comercial"]'::jsonb),
('semiannual', 'Plano Semestral', 6, 249.90, 299.40, 41.65, 16, 'O mais escolhido por barbeiros profissionais. Economize 16% e garanta sua agenda ativa por 6 meses.', 'Mais Popular', TRUE, TRUE, '["Todos os recursos do Plano Mensal", "1 mês de economia total garantida", "Prioridade na lista de barbearias em destaque", "Painel de métricas de retorno e clientes fiéis", "Suporte prioritário via WhatsApp", "Garantia de congelamento de preço por 6 meses"]'::jsonb),
('annual', 'Plano Anual', 12, 449.90, 598.80, 37.49, 25, 'Maior economia e tranquilidade para o seu negócio. Pague o equivalente a apenas R$ 37,49/mês.', 'Melhor Custo-Benefício (25% OFF)', FALSE, TRUE, '["Todos os recursos do Plano Semestral", "Quase 3 meses grátis de plataforma", "Selo Oficial \\"Barbearia Verificada & Premium\\"", "Personalização avançada de cores e identidade", "Consultoria exclusiva para captação de clientes", "Suporte VIP direto com o administrador geral"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurações da Plataforma
INSERT INTO public.platform_settings (id, platform_name, platform_pix_key, platform_pix_key_type, platform_pix_receiver_name, monthly_fee, support_phone, support_email, pix_instructions)
VALUES
('global_settings', 'BarberHub Brasil', 'financeiro@barberhub.com.br', 'email', 'BARBERHUB TECNOLOGIA LTDA', 49.90, '11999887766', 'contato@barberhub.com.br', 'Transfira o valor exato da taxa para a chave PIX acima e anexe ou confirme o pagamento para ativação imediata pelo administrador geral.')
ON CONFLICT (id) DO NOTHING;

-- 3. Barbearia Inicial de Demonstração
INSERT INTO public.barbershops (id, owner_id, owner_name, owner_phone, name, slug, logo_url, banner_url, phone, address, city, instagram, bio, theme_color, pix_key, pix_key_type, pix_receiver_name, subscription_plan_id, subscription_status, subscription_monthly_fee, subscription_valid_until, slot_interval_minutes)
VALUES
('shop_navalha', 'user_navalha', 'Rodrigo Silva', '11987654321', 'Navalha de Ouro Barbearia', 'navalha-de-ouro', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop&q=80', '11987654321', 'Rua Augusta, 1500 - Consolação', 'São Paulo, SP', '@navalhadouro.oficial', 'Barbearia clássica com toalha quente, cerveja artesanal e especialistas em cortes fade e barba desenhada.', '#d97706', '11987654321', 'phone', 'Rodrigo Silva - Navalha de Ouro', 'annual', 'active', 449.90, '2026-12-31', 30),
('shop_vintage', 'user_vintage', 'Marcos Oliveira', '21976543210', 'Vintage Club Barber', 'vintage-club', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=1200&auto=format&fit=crop&q=80', '21976543210', 'Av. Copacabana, 800', 'Rio de Janeiro, RJ', '@vintageclubbarber', 'Tradição e modernidade no coração de Copacabana.', '#0284c7', 'contato@vintageclub.com.br', 'email', 'Marcos Oliveira', 'semiannual', 'active', 249.90, '2026-10-15', 30)
ON CONFLICT (id) DO NOTHING;

-- 4. Serviços Iniciais
INSERT INTO public.services (id, barbershop_id, name, description, price, duration_minutes, category, active, icon_name)
VALUES
('srv_1', 'shop_navalha', 'Corte Degradê / Fade', 'Corte com máquina e tesoura, finalização com pomada modeladora e lavagem.', 45.00, 30, 'cabelo', TRUE, 'Scissors'),
('srv_2', 'shop_navalha', 'Barba Completa com Toalha Quente', 'Alinhamento na navalha, hidratação de barba e massagem facial relaxante.', 35.00, 30, 'barba', TRUE, 'Sparkles'),
('srv_3', 'shop_navalha', 'Combo Cabelo + Barba VIP', 'Corte completo + Barboterapia completa com desconto especial.', 70.00, 50, 'combo', TRUE, 'Crown'),
('srv_4', 'shop_navalha', 'Pezinho e Sobrancelha', 'Acabamento da nuca com navalha e desenho de sobrancelha na pinça/lâmina.', 20.00, 15, 'outros', TRUE, 'Flame'),
('srv_5', 'shop_navalha', 'Platinado / Nevou', 'Descoloração global com tonalização cinza ou branco neve e hidratação.', 130.00, 90, 'quimica', TRUE, 'Zap'),
('srv_6', 'shop_vintage', 'Corte Executivo', 'Corte clássico na tesoura com lavagem refrescante.', 50.00, 30, 'cabelo', TRUE, 'Scissors'),
('srv_7', 'shop_vintage', 'Barba Tradicional', 'Barbear clássico com espuma aquecida e navalhete.', 40.00, 30, 'barba', TRUE, 'Sparkles')
ON CONFLICT (id) DO NOTHING;

-- 5. Usuários Iniciais
INSERT INTO public.users (id, name, phone, email, password, role, barbershop_id, avatar_url)
VALUES
('user_superadmin', 'Administrador Geral', '11999998888', 'admin@barberhub.com.br', 'admin123', 'super_admin', NULL, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),
('user_navalha', 'Rodrigo Silva', '11987654321', 'rodrigo@navalhadouro.com.br', 'barber123', 'barber', 'shop_navalha', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80'),
('user_vintage', 'Marcos Oliveira', '21976543210', 'marcos@vintageclub.com.br', 'barber123', 'barber', 'shop_vintage', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200&auto=format&fit=crop&q=80'),
('user_client_1', 'Lucas Mendes', '11911223344', 'lucas.mendes@gmail.com', 'cliente123', 'client', NULL, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================

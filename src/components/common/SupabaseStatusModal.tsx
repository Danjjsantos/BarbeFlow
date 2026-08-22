import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  Code2,
  ListOrdered,
  Layers,
  FileCode,
  Table,
} from 'lucide-react';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FULL_SCHEMA_SQL = `-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE - PLATAFORMA SAAS BARBEARIAS
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. TABELA DE BARBEARIAS
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
    pix_key_type TEXT DEFAULT 'cpf',
    pix_receiver_name TEXT,
    subscription_plan_id TEXT DEFAULT 'monthly',
    subscription_status TEXT DEFAULT 'active',
    subscription_monthly_fee NUMERIC(10, 2) DEFAULT 49.90,
    subscription_valid_until DATE,
    subscription_proof_url TEXT,
    subscription_requested_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_last_payment_date DATE,
    working_hours JSONB DEFAULT '{}'::jsonb,
    slot_interval_minutes INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    barbershop_id TEXT NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 30,
    category TEXT DEFAULT 'cabelo',
    active BOOLEAN DEFAULT TRUE,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE AGENDAMENTOS
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
    status TEXT NOT NULL DEFAULT 'confirmed',
    pix_key_used TEXT,
    pix_transaction_code TEXT,
    pix_paid_at TIMESTAMPTZ,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by TEXT,
    cancelled_at TIMESTAMPTZ,
    payment_method TEXT DEFAULT 'pix',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    barbershop_id TEXT REFERENCES public.barbershops(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE PLANOS DE ASSINATURA
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

-- 6. TABELA DE CONFIGURAÇÕES DA PLATAFORMA
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

-- 7. TABELA DE LANDING PAGE
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

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_barbershops_slug ON public.barbershops(slug);
CREATE INDEX IF NOT EXISTS idx_services_barbershop_id ON public.services(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_date ON public.appointments(barbershop_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON public.appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- SEGURANÇA ROW LEVEL SECURITY (RLS)
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO PÚBLICO ANON
CREATE POLICY "Permitir tudo para barbershops" ON public.barbershops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para landing_content" ON public.landing_content FOR ALL USING (true) WITH CHECK (true);

-- HABILITAR REALTIME
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'appointments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'barbershops') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.barbershops;
    END IF;
END $$;`;

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isSupabaseActive, supabaseStatus, checkSupabaseConnection, appointments, barbershops, services, users } =
    useApp();
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'guide'>('sql');
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRecheck = async () => {
    setIsChecking(true);
    await checkSupabaseConnection();
    setTimeout(() => setIsChecking(false), 500);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(FULL_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tablesList = [
    {
      name: 'barbershops',
      desc: 'Cadastro de barbearias, dados de contato, slug único, personalização e status de assinatura SaaS.',
      count: barbershops.length,
      icon: Table,
      color: 'text-amber-400',
    },
    {
      name: 'services',
      desc: 'Catálogo de serviços por barbearia (preço, duração, categoria, ícone e status ativo).',
      count: services.length,
      icon: Table,
      color: 'text-emerald-400',
    },
    {
      name: 'appointments',
      desc: 'Agendamentos com data, hora, barbeiro, cliente, status de pagamento PIX e cancelamentos.',
      count: appointments.length,
      icon: Table,
      color: 'text-sky-400',
    },
    {
      name: 'users',
      desc: 'Contas de acesso de Super Administrador, Barbeiros/Donos e Clientes.',
      count: users.length,
      icon: Table,
      color: 'text-purple-400',
    },
    {
      name: 'subscription_plans',
      desc: 'Planos de assinatura SaaS para monetização da plataforma (Mensal, Semestral, Anual).',
      count: 3,
      icon: Table,
      color: 'text-pink-400',
    },
    {
      name: 'platform_settings',
      desc: 'Configurações globais, chave PIX da plataforma e dados de suporte.',
      count: 1,
      icon: Table,
      color: 'text-yellow-400',
    },
    {
      name: 'landing_content',
      desc: 'Conteúdo dinâmico da Landing Page (vídeos, títulos, depoimentos e FAQ).',
      count: 1,
      icon: Table,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isSupabaseActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Tabelas & Integração Supabase
                {isSupabaseActive ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Conectado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Modo Local
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                PostgreSQL em Nuvem • Sincronização em Tempo Real • Políticas RLS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 sm:px-6">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition -mb-px ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Script SQL das Tabelas</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition -mb-px ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tabelas & Registros ({tablesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition -mb-px ${
              activeTab === 'guide'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Como Configurar (3 Passos)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: SCRIPT SQL */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <div className="flex items-start gap-3">
                  <FileCode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Script de Criação de Todas as Tabelas
                    </h4>
                    <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                      Copie o script abaixo e execute no <strong>SQL Editor</strong> do seu painel Supabase para criar as 7 tabelas e habilitar o Realtime.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0 shadow-md"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'SQL Copiado com Sucesso!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              {/* Code Box */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    supabase_schema.sql
                  </span>
                  <span>PostgreSQL DDL</span>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed scrollbar-thin">
                  <code>{FULL_SCHEMA_SQL}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: TABELAS & STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Connection Status Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  isSupabaseActive
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSupabaseActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">
                      {isSupabaseActive ? 'Supabase Conectado & Operacional' : 'Armazenamento Local Ativo'}
                    </h4>
                    <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                      {supabaseStatus.message}
                    </p>
                  </div>

                  <button
                    onClick={handleRecheck}
                    disabled={isChecking}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>Testar</span>
                  </button>
                </div>
              </div>

              {/* Tables Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-amber-400" />
                  Estrutura de Tabelas do Banco de Dados
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {tablesList.map((tbl) => (
                    <div
                      key={tbl.name}
                      className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                          <Table className={`w-4 h-4 ${tbl.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              public.{tbl.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                              RLS Ativo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{tbl.desc}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-base font-black ${tbl.color}`}>
                          {tbl.count}
                        </span>
                        <p className="text-[10px] text-slate-500">registros</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUIA PASSO A PASSO */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Crie sua conta e projeto no Supabase
                  </h4>
                </div>
                <p className="text-slate-400 pl-8 leading-relaxed">
                  Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">supabase.com</a>, crie uma conta gratuita e clique em <strong>"New Project"</strong>. Escolha a região mais próxima (ex: <em>São Paulo / South America</em>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Execute o Script SQL no SQL Editor
                  </h4>
                </div>
                <p className="text-slate-400 pl-8 leading-relaxed">
                  No menu lateral esquerdo do Supabase, clique no ícone do <strong>SQL Editor</strong> &gt; <strong>New Query</strong>. Cole o conteúdo da aba <strong>"Script SQL das Tabelas"</strong> e clique em <strong>"RUN"</strong>. Todas as tabelas e políticas serão criadas em 2 segundos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Copie as Credenciais de API
                  </h4>
                </div>
                <p className="text-slate-400 pl-8 leading-relaxed">
                  No menu do Supabase, acesse <strong>Project Settings &gt; API</strong> e copie:
                </p>
                <div className="pl-8 space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400">
                    VITE_SUPABASE_URL = https://seu-projeto.supabase.co
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
                    VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Arquivo salvo na raiz: <code className="text-amber-400 font-mono">supabase_schema.sql</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySchema}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  ShieldCheck,
  Radio,
  Server,
  Zap,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SUPABASE_SQL_SCHEMA,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  resetStoredSupabaseConfig,
} from '../../lib/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isSupabaseActive,
    supabaseStatus,
    checkSupabaseConnection,
    syncAllToSupabase,
  } = useApp();

  const [customUrl, setCustomUrl] = useState('');
  const [customAnonKey, setCustomAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'credentials'>('status');

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setCustomUrl(config.url);
      setCustomAnonKey(config.key);
      setSyncFeedback(null);
      checkSupabaseConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setSyncFeedback(null);
    await checkSupabaseConnection();
    setIsTesting(false);
  };

  const handleSaveCredentials = async () => {
    saveStoredSupabaseConfig(customUrl, customAnonKey);
    setIsTesting(true);
    await checkSupabaseConnection();
    setIsTesting(false);
  };

  const handleResetCredentials = async () => {
    resetStoredSupabaseConfig();
    const def = getStoredSupabaseConfig();
    setCustomUrl(def.url);
    setCustomAnonKey(def.key);
    await checkSupabaseConnection();
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncAllToSupabase();
    setSyncFeedback(res);
    setIsSyncing(false);
    if (res.success) {
      await checkSupabaseConnection();
    }
  };

  const currentProjectId = (() => {
    try {
      const u = new URL(customUrl);
      return u.hostname.split('.')[0] || '_';
    } catch {
      return '_';
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg ${
                isSupabaseActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Integração Banco Supabase
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isSupabaseActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isSupabaseActive ? 'Conectado' : 'Ação Necessária'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronização em tempo real, persistência em nuvem e alta performance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Status & Sincronização</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Credenciais & URL</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Script SQL (Tabelas)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* TAB 1: STATUS & SYNC */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Connection Status Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  isSupabaseActive
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSupabaseActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm">
                      {isSupabaseActive
                        ? 'Banco Supabase Conectado & Operacional'
                        : 'Status da Conexão com Supabase'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {supabaseStatus.message}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1 break-all">
                      Endpoint: {customUrl}
                    </p>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition shrink-0 flex items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`}
                    />
                    <span>{isTesting ? 'Testando...' : 'Re-testar'}</span>
                  </button>
                </div>
              </div>

              {/* Sync Section */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-white">
                      Sincronizar Dados Locais para o Supabase
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">8 Tabelas</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exporta e popula barbearias, serviços, agendamentos, usuários, planos,
                  configurações da plataforma e conteúdo da landing page diretamente nas tabelas
                  do Supabase.
                </p>

                {syncFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs space-y-2 border ${
                      syncFeedback.success
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {syncFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <span className="font-semibold leading-relaxed">{syncFeedback.message}</span>
                    </div>

                    {!syncFeedback.success && (
                      <div className="pt-1.5 border-t border-rose-900/40 text-[11px] text-slate-300 space-y-1.5">
                        <p className="font-bold text-amber-300">Como resolver em 2 minutos:</p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-300">
                          <li>
                            Acesse seu projeto no{' '}
                            <a
                              href={`https://supabase.com/dashboard/project/${currentProjectId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 underline font-bold"
                            >
                              Supabase Dashboard <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>{' '}
                            e verifique se ele está <strong>Active</strong> (se estiver "Paused", clique em <em>Restore</em>).
                          </li>
                          <li>
                            Vá até a aba <strong>"Script SQL (Tabelas)"</strong> acima, copie o script e cole no{' '}
                            <a
                              href={`https://supabase.com/dashboard/project/${currentProjectId}/sql`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 underline font-bold"
                            >
                              SQL Editor do Supabase <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>
                            , depois clique em <strong>Run</strong>.
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSyncData}
                  disabled={isSyncing}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando com Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Sincronizar Todos os Dados para o Supabase</span>
                    </>
                  )}
                </button>
              </div>

              {/* Realtime Info Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-indigo-300 block">
                    Atualizações em Tempo Real (Realtime Postgres)
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    Quando um cliente agenda ou um barbeiro altera horários/serviços, o Supabase
                    emite eventos via WebSocket atualizando instantaneamente todas as telas
                    abertas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    URL do Projeto Supabase (Project URL)
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://seu-projeto.supabase.co"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-amber-500 outline-none transition"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Encontrado no painel Supabase &gt; Project Settings &gt; API
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Chave Pública / Anon Key (Publishable)
                  </label>
                  <input
                    type="text"
                    value={customAnonKey}
                    onChange={(e) => setCustomAnonKey(e.target.value)}
                    placeholder="sb_publishable_..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-amber-500 outline-none transition"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Chave segura de leitura/escrita do cliente (anon public key).
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSaveCredentials}
                    disabled={isTesting}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Salvar &amp; Testar Conexão</span>
                  </button>
                  <button
                    onClick={handleResetCredentials}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </div>

              {/* Quick links */}
              <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Acesse o Console Oficial do Supabase:</span>
                <a
                  href={`https://supabase.com/dashboard/project/${currentProjectId}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Abrir Project Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Script SQL de Criação de Tabelas &amp; RLS
                  </h4>
                  <p className="text-xs text-slate-400">
                    Copie e cole este script no{' '}
                    <a
                      href={`https://supabase.com/dashboard/project/${currentProjectId}/sql`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 underline font-bold"
                    >
                      SQL Editor do Supabase <ExternalLink className="w-3 h-3 inline" />
                    </a>{' '}
                    e clique em <strong>Run</strong>.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed select-all">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5 text-xs text-slate-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  O script cria as 8 tabelas estruturadas (barbershops, services, appointments,
                  users, subscription_plans, platform_settings, trial_records, landing_page_content),
                  habilita RLS e ativa as publicações Realtime automaticamente.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Persistência Segura &amp; Criptografada</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

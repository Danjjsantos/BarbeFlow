import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Link2,
  Shield,
  Scissors,
  Calendar,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Globe,
  KeyRound,
  Eye,
} from 'lucide-react';

interface AccessLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessLinksModal: React.FC<AccessLinksModalProps> = ({ isOpen, onClose }) => {
  const {
    barbershops,
    activeBarbershopId,
    getBarbershopById,
    currentUser,
    setCurrentView,
    openLoginModal,
  } = useApp();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://barberclock.com.br';
  const activeShop = getBarbershopById(activeBarbershopId) || barbershops[0];
  const shopSlug = activeShop?.slug || 'barberclock';

  const links = [
    {
      id: 'admin',
      title: 'Acesso Administrador Geral (Super Admin)',
      badge: 'Painel Master',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: Shield,
      iconBg: 'bg-indigo-600 text-white',
      url: `${currentOrigin}/#admin`,
      hash: '#admin',
      description: 'Gerenciamento global de todas as barbearias, aprovação de mensalidades PIX, edição de planos e configurações.',
      credentials: 'E-mail: danjs23@gmail.com | Senha: admin123',
      onNavigate: () => {
        onClose();
        if (currentUser.role === 'super_admin') {
          setCurrentView('super_admin_dashboard');
        } else {
          openLoginModal('super_admin');
        }
        window.location.hash = '#admin';
      },
    },
    {
      id: 'barber',
      title: 'Acesso Barbeiro / Gestão da Barbearia',
      badge: 'Painel do Barbeiro',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Scissors,
      iconBg: 'bg-amber-500 text-slate-950',
      url: `${currentOrigin}/#barbeiro`,
      hash: '#barbeiro',
      description: 'Agenda diária de clientes, controle financeiro em tempo real, cadastro de serviços, horários e chave PIX.',
      credentials: 'E-mail: carlos@barberclock.com.br | Senha: 123456',
      onNavigate: () => {
        onClose();
        if (currentUser.role === 'barber' || currentUser.role === 'super_admin') {
          setCurrentView('barber_dashboard');
        } else {
          openLoginModal('barber');
        }
        window.location.hash = '#barbeiro';
      },
    },
    {
      id: 'client',
      title: `Agendamento de Clientes (${activeShop?.name || 'Barbearia'})`,
      badge: 'Página Pública',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Calendar,
      iconBg: 'bg-emerald-600 text-white',
      url: `${currentOrigin}/#${shopSlug}`,
      hash: `#${shopSlug}`,
      description: 'Página pública que os clientes utilizam para escolher barbeiro, serviços, data, horário e pagar via PIX.',
      credentials: 'Acesso direto e público para todos os clientes.',
      onNavigate: () => {
        onClose();
        setCurrentView('client_booking');
        window.location.hash = `#${shopSlug}`;
      },
    },
    {
      id: 'landing',
      title: 'Apresentação Institucional & Planos',
      badge: 'Planos & Preços',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      icon: Sparkles,
      iconBg: 'bg-orange-500 text-slate-950',
      url: `${currentOrigin}/#planos`,
      hash: '#planos',
      description: 'Página de apresentação com simulador de faturamento, demonstração em vídeo, planos e credenciamento.',
      credentials: 'Acesso aberto a novos barbeiros e interessados.',
      onNavigate: () => {
        onClose();
        setCurrentView('landing_page');
        window.location.hash = '#planos';
      },
    },
  ];

  const handleCopy = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-6 text-slate-900 dark:text-slate-100"
        id="access-links-modal"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Links de Acesso ao Sistema
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                URLs diretas para Administrador, Barbeiro, Agendamento e Apresentação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Você pode compartilhar ou salvar esses links nos seus favoritos. Qualquer link com a terminação <strong>#admin</strong> ou <strong>#barbeiro</strong> redireciona diretamente para o respectivo login/painel.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {links.map((item) => {
              const Icon = item.icon;
              const isCopied = copiedKey === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-500/40 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* URL Box */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-mono">
                    <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">{item.hash}</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate flex-1 select-all">{item.url}</span>
                    
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.url)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                      title="Copiar Link para a área de transferência"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={item.onNavigate}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      title="Abrir esta tela agora"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Acessar</span>
                    </button>
                  </div>

                  {/* Credentials / Note */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{item.credentials}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

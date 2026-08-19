import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  Scissors,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'barber' | 'super_admin';
  onOpenRegister?: () => void;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'barber',
  onOpenRegister,
}) => {
  const { loginUser, users, setCurrentView, openRegisterModal } = useApp();

  const [activeTab, setActiveTab] = useState<'barber' | 'super_admin'>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRole);
      setErrorMessage('');
      setSuccessMessage('');
      // Pre-fill with reasonable sample depending on tab
      if (initialRole === 'super_admin') {
        setIdentifier('admin@barberhub.com.br');
        setPassword('admin123');
      } else {
        setIdentifier('carlos@navalhadouro.com.br');
        setPassword('123456');
      }
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'barber' | 'super_admin') => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    if (tab === 'super_admin') {
      setIdentifier('admin@barberhub.com.br');
      setPassword('admin123');
    } else {
      setIdentifier('carlos@navalhadouro.com.br');
      setPassword('123456');
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe seu e-mail/login e sua senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = loginUser(identifier.trim(), password.trim());
      setIsLoading(false);

      if (result.success && result.user) {
        // Check role compatibility
        if (activeTab === 'super_admin' && result.user.role !== 'super_admin') {
          setErrorMessage('Esta conta pertence a um barbeiro/cliente, não ao Administrador Geral.');
          return;
        }

        if (activeTab === 'barber' && result.user.role !== 'barber' && result.user.role !== 'super_admin') {
          setErrorMessage('Esta conta não possui perfil de barbeiro credenciado.');
          return;
        }

        setSuccessMessage(`Bem-vindo de volta, ${result.user.name.split(' ')[0]}!`);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(result.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    }, 350);
  };

  const handleGoToRegister = () => {
    onClose();
    if (onOpenRegister) {
      onOpenRegister();
    } else {
      openRegisterModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden my-6 text-slate-900 dark:text-slate-100"
        id="auth-login-modal"
      >
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-orange-950 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-orange-800/40 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-600/30">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Acesso ao Sistema
              </h3>
              <p className="text-xs text-orange-300 font-medium">
                {activeTab === 'barber'
                  ? 'Painel de Gestão da Barbearia'
                  : 'Administração Geral da Plataforma'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Segment Tabs */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTabChange('barber')}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                activeTab === 'barber'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Sou Barbeiro
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('super_admin')}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
                activeTab === 'super_admin'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Geral
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email/Login Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {activeTab === 'barber' ? 'E-mail ou WhatsApp do Barbeiro' : 'E-mail do Administrador'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={
                  activeTab === 'barber'
                    ? 'ex: carlos@navalhadouro.com.br'
                    : 'admin@barberhub.com.br'
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Senha de Acesso
              </label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    'Para redefinir sua senha, entre em contato com o suporte do Administrador Geral pelo WhatsApp.'
                  )
                }
                className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-semibold"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg shadow-orange-600/25 hover:shadow-orange-600/40 transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Autenticando...
              </span>
            ) : (
              <>
                <span>Entrar no Painel {activeTab === 'barber' ? 'do Barbeiro' : 'do Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Fill Pills for Testing */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Acesso Rápido para Demonstração:
            </span>

            {activeTab === 'super_admin' ? (
              <button
                type="button"
                onClick={() => handleFillDemo('admin@barberhub.com.br', 'admin123')}
                className="w-full text-left p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-100/70 dark:hover:bg-orange-950/50 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Roberto Mendes (Admin Master)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      admin@barberhub.com.br • senha: <strong>admin123</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/60 px-2 py-0.5 rounded-lg">
                  Preencher
                </span>
              </button>
            ) : (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleFillDemo('carlos@navalhadouro.com.br', '123456')}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Carlos Silva (Navalha de Ouro)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        carlos@navalhadouro.com.br • senha: <strong>123456</strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/60 px-2 py-0.5 rounded-lg">
                    Preencher
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo('marcos@vintagebarber.com.br', '123456')}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Marcos Rocha (Vintage Club)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        marcos@vintagebarber.com.br • senha: <strong>123456</strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/60 px-2 py-0.5 rounded-lg">
                    Preencher
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Register Callout */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              Ainda não possui sua barbearia cadastrada?{' '}
              <button
                type="button"
                onClick={handleGoToRegister}
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
              >
                Credenciar Barbearia
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

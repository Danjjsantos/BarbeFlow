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
import { ForgotPasswordModal } from './ForgotPasswordModal';

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
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRole);
      setErrorMessage('');
      setSuccessMessage('');
      setIdentifier('');
      setPassword('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'barber' | 'super_admin') => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    setIdentifier('');
    setPassword('');
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

        setSuccessMessage(`Autenticado com sucesso. Bem-vindo(a), ${result.user.name.split(' ')[0]}!`);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          onClose();
        }, 500);
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
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Acesso Profissional
              </h3>
              <p className="text-xs text-amber-400 font-medium">
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
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
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
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
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
              {activeTab === 'barber' ? 'E-mail ou WhatsApp da Barbearia' : 'E-mail do Administrador'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={
                  activeTab === 'barber'
                    ? 'seuemail@suabarbearia.com.br'
                    : 'admin@barberhub.com.br'
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-black placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
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
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] text-amber-500 hover:text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-black placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Autenticando credenciais...
              </span>
            ) : (
              <>
                <span>Acessar Painel {activeTab === 'barber' ? 'da Barbearia' : 'do Administrador'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Professional Security & Compliance Notice */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ambiente Seguro SSL 256-Bit</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Acesso Criptografado</span>
            </div>
          </div>

          {/* Footer Register Callout */}
          <div className="pt-1 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ainda não possui sua barbearia cadastrada?{' '}
              <button
                type="button"
                onClick={handleGoToRegister}
                className="font-bold text-amber-500 hover:text-amber-400 hover:underline"
              >
                Credenciar Barbearia
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialIdentifier={identifier}
        onBackToLogin={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};

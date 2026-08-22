import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Mail,
  MessageCircle,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPhone } from '../../utils/formatters';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onBackToLogin?: () => void;
}

const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
};

const maskPhone = (phone: string) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) return phone || '';
  const ddd = digits.slice(0, 2);
  const start = digits.slice(2, 4);
  const end = digits.slice(-2);
  return `(${ddd}) ${start}***-**${end}`;
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  onBackToLogin,
}) => {
  const { users, barbershops, platformSettings, updateUserPassword } = useApp();

  const [inputVal, setInputVal] = useState(initialIdentifier);
  const [step, setStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [tempCode, setTempCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasDispatched, setHasDispatched] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  React.useEffect(() => {
    if (isOpen) {
      setInputVal(initialIdentifier);
      setStep('request');
      setFoundUser(null);
      setTempCode('');
      setEnteredCode('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setSuccessMessage('');
      setIsLoading(false);
      setHasDispatched(false);
      setCountdown(0);
    }
  }, [isOpen, initialIdentifier]);

  React.useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Handle Find User and Send Recovery Code
  const handleRequestRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = inputVal.trim();
    if (!cleanInput) {
      setErrorMessage('Por favor, informe seu e-mail ou telefone cadastrado.');
      return;
    }

    const cleanLower = cleanInput.toLowerCase();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    // Search for user
    const matched = users.find((u) => {
      const userEmail = (u.email || '').toLowerCase().trim();
      const userPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const matchEmail = userEmail && userEmail === cleanLower;
      const matchPhone = cleanDigits.length >= 8 && userPhoneDigits.includes(cleanDigits);
      return matchEmail || matchPhone;
    });

    if (!matched) {
      setErrorMessage(
        'Nenhuma conta encontrada com este e-mail ou WhatsApp. Verifique se digitou corretamente.'
      );
      return;
    }

    setIsLoading(true);

    // Generate a 6-digit recovery PIN
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    setTempCode(generatedCode);
    setFoundUser(matched);

    setTimeout(() => {
      setIsLoading(false);
      setStep('sent');
      setCountdown(60);
      setHasDispatched(true);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    }, 600);
  };

  // Helper to open WhatsApp with recovery message
  const handleOpenWhatsAppRecovery = () => {
    if (!foundUser) return;
    const phoneDigits = (foundUser.phone || '').replace(/\D/g, '');
    const cleanPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
    const shopName = foundUser.barbershopId
      ? barbershops.find((s) => s.id === foundUser.barbershopId)?.name || 'sua barbearia'
      : 'BarberClock';

    const message = encodeURIComponent(
      `🔒 *Recuperação de Acesso - BarberClock*\n\n` +
        `Olá *${foundUser.name}*!\n\n` +
        `Seu código de segurança para redefinir a senha no BarberClock (${shopName}) é:\n\n` +
        `🔑 *${tempCode}*\n\n` +
        `Digite este código de 6 dígitos na tela do sistema para cadastrar sua nova senha.\n\n` +
        `⚠️ Por segurança, nunca compartilhe este código com ninguém.`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Helper to open Email with recovery message
  const handleOpenEmailRecovery = () => {
    if (!foundUser || !foundUser.email) return;
    const subject = encodeURIComponent(`[BarberClock] Código de Recuperação de Senha`);
    const body = encodeURIComponent(
      `Olá ${foundUser.name},\n\n` +
        `Seu código de verificação para redefinir a senha no BarberClock é: ${tempCode}\n\n` +
        `Insira este código na tela de recuperação para cadastrar sua nova senha com segurança.\n\n` +
        `Atenciosamente,\nEquipe BarberClock`
    );

    window.open(`mailto:${foundUser.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Resend code
  const handleResendCode = () => {
    if (countdown > 0) return;
    const newGenCode = String(Math.floor(100000 + Math.random() * 900000));
    setTempCode(newGenCode);
    setCountdown(60);
    setErrorMessage('');
    setSuccessMessage('Novo código gerado e reenviado aos contatos cadastrados.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Verify Code and Proceed to Reset Password
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredCode.trim() !== tempCode.trim()) {
      setErrorMessage('Código de verificação incorreto. Verifique o código de 6 dígitos recebido no seu WhatsApp ou E-mail.');
      return;
    }

    setStep('reset');
  };

  // Save New Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword.trim()) {
      setErrorMessage('Por favor, informe uma nova senha.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação da nova senha não coincide.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = updateUserPassword(foundUser.id, newPassword.trim());
      setIsLoading(false);

      if (result.success) {
        setSuccessMessage('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          onClose();
          if (onBackToLogin) {
            onBackToLogin();
          }
        }, 1200);
      } else {
        setErrorMessage(result.message || 'Erro ao alterar a senha.');
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden text-slate-900 dark:text-slate-100 my-6"
        id="forgot-password-modal"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Recuperação de Senha
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                {step === 'request' && 'Receba um link ou código de redefinição'}
                {step === 'sent' && 'Confirmação do código de segurança'}
                {step === 'reset' && 'Cadastre sua nova senha'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Request Email / Phone */}
        {step === 'request' && (
          <form onSubmit={handleRequestRecovery} className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Informe o <strong>e-mail</strong> ou <strong>número de WhatsApp</strong> cadastrado na sua conta de barbeiro ou administrador para enviarmos a verificação.
            </p>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                E-mail ou WhatsApp Cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: seuemail@gmail.com ou (11) 98888-7777"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Localizando sua conta...
                  </span>
                ) : (
                  <>
                    <span>Enviar Código de Recuperação</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onBackToLogin) onBackToLogin();
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Lembrou da senha? Voltar para o Login
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Secure Delivery & Verification */}
        {step === 'sent' && foundUser && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>Código de Segurança Enviado com Sucesso!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Por motivos de segurança, o código de recuperação foi encaminhado aos canais cadastrados da conta de <strong>{foundUser.name}</strong>:
              </p>

              {/* Masked Channels Box */}
              <div className="space-y-1.5 pt-1">
                {foundUser.phone && (
                  <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>WhatsApp:</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {maskPhone(foundUser.phone)}
                    </span>
                  </div>
                )}

                {foundUser.email && (
                  <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>E-mail:</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {maskEmail(foundUser.email)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Action Dispatch Triggers */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Acessar canais de recebimento:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {foundUser.phone && (
                  <button
                    type="button"
                    onClick={handleOpenWhatsAppRecovery}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                    title="Abrir WhatsApp para receber o código na conversa"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Receber no WhatsApp</span>
                  </button>
                )}

                {foundUser.email && (
                  <button
                    type="button"
                    onClick={handleOpenEmailRecovery}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                    title="Verificar instruções no E-mail"
                  >
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Receber por E-mail</span>
                  </button>
                )}
              </div>
            </div>

            {/* Form to enter the 6 digit code received */}
            <form onSubmit={handleVerifyCode} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Digite o código de 6 dígitos que você recebeu:
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xl font-black tracking-widest py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:tracking-widest"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Validar Código e Criar Nova Senha</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Trocar e-mail ou número
                </button>

                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleResendCode}
                  className="text-amber-500 hover:text-amber-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {countdown > 0 ? `Reenviar código (${countdown}s)` : 'Reenviar código'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Digite a <strong>nova senha</strong> de acesso para a conta de <strong>{foundUser?.name}</strong>:
            </p>

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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Salvando nova senha...
                  </span>
                ) : (
                  <>
                    <span>Atualizar e Salvar Senha</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

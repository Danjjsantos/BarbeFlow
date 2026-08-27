import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  User as UserIcon,
  Check,
  Phone,
  Mail,
  Shield,
  AlertCircle,
  Scissors,
} from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useApp();

  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'O nome do administrador não pode ficar em branco.' });
      return;
    }

    const res = updateUserProfile(currentUser.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });

    if (res.success) {
      setFeedback({ type: 'success', message: 'Dados do perfil atualizados com sucesso!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Erro ao salvar alterações.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                Perfil do Administrador Geral
              </h3>
              <p className="text-xs text-slate-400">
                Informações de contato e credenciais de acesso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Barbershop Themed Yellow Scissor Avatar Badge */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-amber-500/30 flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500 shadow-xl shadow-amber-500/20 flex items-center justify-center shrink-0">
              <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 -rotate-45" />
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  BarberClock
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <h4 className="font-black text-sm sm:text-base text-white truncate mt-1">
                {currentUser.name}
              </h4>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Super Administrador da Plataforma</span>
              </p>
            </div>
          </div>

          {/* Form Fields: Name, Email, Phone */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome do Administrador
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Danilo Santos"
                  className="w-full bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-black placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email de Acesso / Contato
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@barberclock.com.br"
                    className="w-full bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-black placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-black placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

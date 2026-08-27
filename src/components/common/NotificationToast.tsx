import React, { useEffect, useState } from 'react';
import {
  subscribeToInAppToasts,
  ToastNotificationPayload,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
} from '../../utils/notifications';
import {
  Bell,
  Clock,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  ChevronRight,
} from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotificationPayload[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToInAppToasts((newToast) => {
      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

      // Auto dismiss
      const duration = newToast.durationMs || 6500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      id="barberclock-toast-container"
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-3"
    >
      {toasts.map((toast) => {
        const isReminder = toast.iconType === 'reminder';
        const isBarber = toast.iconType === 'barber';
        const isCancel = toast.iconType === 'cancel';
        const isSuccess = toast.iconType === 'success' || toast.iconType === 'client';

        return (
          <div
            key={toast.id}
            id={toast.id}
            onClick={() => {
              if (toast.onClick) {
                toast.onClick();
              }
              removeToast(toast.id);
            }}
            className={`pointer-events-auto cursor-pointer rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-0 animate-slide-in-down flex items-start gap-3 relative overflow-hidden group ${
              isReminder
                ? 'bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-900/30'
                : isBarber
                ? 'bg-slate-900/95 text-slate-100 border-amber-500/50 shadow-black/50'
                : isCancel
                ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-900/30'
                : 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-900/30'
            }`}
          >
            {/* Ambient indicator bar */}
            <div
              className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                isReminder
                  ? 'bg-amber-400'
                  : isBarber
                  ? 'bg-amber-500'
                  : isCancel
                  ? 'bg-rose-500'
                  : 'bg-emerald-400'
              }`}
            />

            {/* Icon Bubble */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                isReminder
                  ? 'bg-amber-500/20 text-amber-300'
                  : isBarber
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : isCancel
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {isReminder ? (
                <Clock className="w-5 h-5 animate-pulse" />
              ) : isBarber ? (
                <Scissors className="w-5 h-5" />
              ) : isCancel ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/90">
                  {isReminder ? 'Lembrete' : isBarber ? 'Barbearia' : isCancel ? 'Cancelamento' : 'Confirmado'}
                </span>
                <span className="text-[10px] text-white/50 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Notificação Ativa
                </span>
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1">
                {toast.title}
              </h4>
              <p className="text-[11px] text-white/80 mt-1 whitespace-pre-line leading-relaxed line-clamp-3">
                {toast.body}
              </p>

              {toast.onClick && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-300 group-hover:underline">
                  <span>Toque para abrir</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              id={`dismiss-${toast.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="absolute top-3 right-3 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

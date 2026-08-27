import React, { useState, useEffect } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  sendTestNotification,
  isNotificationSupported,
  NotificationPermissionState,
  NotificationPreferences,
} from '../../utils/notifications';
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Settings2,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface NotificationBannerProps {
  role: 'barber' | 'client';
  variant?: 'banner' | 'card' | 'compact' | 'pill';
  onAction?: () => void;
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  role,
  variant = 'banner',
  onAction,
  className = '',
}) => {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [isRequesting, setIsRequesting] = useState(false);
  const [isTestSuccess, setIsTestSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
    setPrefs(getNotificationPreferences());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const state = await requestNotificationPermission();
      setPermission(state);
      if (state === 'granted') {
        sendTestNotification(role, onAction);
        setIsTestSuccess(true);
        setTimeout(() => setIsTestSuccess(false), 4000);
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = () => {
    sendTestNotification(role, onAction);
    setIsTestSuccess(true);
    setTimeout(() => setIsTestSuccess(false), 3000);
  };

  const handleToggleSound = () => {
    const updated = saveNotificationPreferences({ soundEnabled: !prefs.soundEnabled });
    setPrefs(updated);
  };

  const handleSetProximityMinutes = (minutes: number) => {
    const updated = saveNotificationPreferences({ proximityMinutes: minutes });
    setPrefs(updated);
  };

  // Compact Pill
  if (variant === 'pill') {
    return (
      <div
        id={`notification-pill-${role}`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${
          permission === 'granted'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : permission === 'denied'
            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        } ${className}`}
      >
        {permission === 'granted' ? (
          <>
            <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Notificações Ativas</span>
            <button
              id={`test-notif-btn-${role}`}
              type="button"
              onClick={handleTestNotification}
              className="ml-1 text-[10px] bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 px-2 py-0.5 rounded-full transition"
            >
              Testar
            </button>
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Ativar Avisos Push</span>
            <button
              id={`enable-notif-btn-${role}`}
              type="button"
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="ml-1 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full transition"
            >
              {isRequesting ? 'Ativando...' : 'Ativar'}
            </button>
          </>
        )}
      </div>
    );
  }

  // Compact Header / Inline Variant
  if (variant === 'compact') {
    return (
      <div
        id={`notification-compact-${role}`}
        className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border text-xs ${
          permission === 'granted'
            ? 'bg-slate-900/80 border-emerald-500/30 text-slate-200'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
          )}
          <div>
            <span className="font-bold block">
              {role === 'barber'
                ? 'Alertas de Novos Agendamentos'
                : 'Lembretes de Proximidade de Horário'}
            </span>
            <span className="text-[11px] opacity-80">
              {permission === 'granted'
                ? `Push no navegador ativo ${prefs.soundEnabled ? 'com som' : '(mudo)'}`
                : 'Ative para receber avisos em tempo real'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <>
              <button
                id={`toggle-sound-${role}`}
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border transition ${
                  prefs.soundEnabled
                    ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
                title={prefs.soundEnabled ? 'Som ativado (clique para mutar)' : 'Som mudo (clique para ativar)'}
              >
                {prefs.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                id={`test-compact-btn-${role}`}
                type="button"
                onClick={handleTestNotification}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-lg text-[11px] transition flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                {isTestSuccess ? 'Enviado!' : 'Testar'}
              </button>
            </>
          ) : (
            <button
              id={`request-compact-btn-${role}`}
              type="button"
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-md flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5" />
              {isRequesting ? 'Ativando...' : 'Ativar Push'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full Card / Banner Variant
  return (
    <div
      id={`notification-banner-card-${role}`}
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        permission === 'granted'
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/30'
          : permission === 'denied'
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border-rose-500/30'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/30'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              permission === 'granted'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : permission === 'denied'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {permission === 'granted' ? (
              <BellRing className="w-5 h-5 animate-pulse" />
            ) : permission === 'denied' ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white">
                {role === 'barber'
                  ? 'Notificações Push para Barbeiro'
                  : 'Lembretes de Horário no Navegador'}
              </h4>
              {permission === 'granted' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Ativado
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {role === 'barber'
                ? 'Receba avisos instantâneos com som no computador ou celular assim que um cliente fizer um novo agendamento.'
                : 'Receba um aviso sonoro antes do seu horário para não esquecer seu atendimento na barbearia.'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {permission === 'granted' ? (
            <>
              <button
                id={`btn-toggle-sound-full-${role}`}
                type="button"
                onClick={handleToggleSound}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  prefs.soundEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                    : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Alternar som de aviso"
              >
                {prefs.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{prefs.soundEnabled ? 'Com Som' : 'Mudo'}</span>
              </button>

              <button
                id={`btn-open-settings-${role}`}
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Configurações de lembrete"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                id={`btn-test-notif-full-${role}`}
                type="button"
                onClick={handleTestNotification}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isTestSuccess ? 'Enviado!' : 'Testar Notificação'}
              </button>
            </>
          ) : permission === 'denied' ? (
            <div className="text-right text-[11px] text-rose-300 flex items-center gap-1.5 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>Notificações bloqueadas nas permissões do seu navegador.</span>
            </div>
          ) : (
            <button
              id={`btn-enable-push-full-${role}`}
              type="button"
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <BellRing className="w-4 h-4" />
              {isRequesting ? 'Solicitando autorização...' : 'Ativar Notificações no Navegador'}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Notification Settings Dropdown */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {role === 'client' && (
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Avisar com antecedência de:
              </label>
              <div className="flex items-center gap-2">
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSetProximityMinutes(mins)}
                    className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition ${
                      prefs.proximityMinutes === mins
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {mins === 60 ? '1 hora' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-slate-400 block font-semibold">Preferências adicionais</span>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={prefs.soundEnabled}
                onChange={handleToggleSound}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
              <span>Tocar som harmônico (chime) nas notificações</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

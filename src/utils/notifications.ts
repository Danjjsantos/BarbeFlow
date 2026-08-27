/**
 * Browser Push Notification & Audio Chime System for BarberClock
 * Provides native Notification API triggers, Web Audio API sound synthesizers,
 * vibration feedback, and notification preference management.
 */

import { Appointment } from '../types';
import { formatDateBr, formatCurrency } from './formatters';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationPreferences {
  soundEnabled: boolean;
  barberNewBookingAlert: boolean;
  clientProximityAlert: boolean;
  proximityMinutes: number; // e.g. 15, 30, 60
  vibrationEnabled: boolean;
}

const PREFERENCES_KEY = 'barberclock_notification_prefs_v1';
const SENT_REMINDERS_KEY = 'barberclock_sent_reminders_v1';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  soundEnabled: true,
  barberNewBookingAlert: true,
  clientProximityAlert: true,
  proximityMinutes: 30,
  vibrationEnabled: true,
};

// Load preferences from localStorage
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('[Notifications] Error loading preferences:', e);
  }
  return DEFAULT_NOTIFICATION_PREFS;
}

// Save preferences to localStorage
export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[Notifications] Error saving preferences:', e);
    }
  }
  return updated;
}

// Check browser notification support
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission state
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

// Request permission with promise and callback fallback
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    if (typeof Notification.requestPermission === 'function') {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionState;
    }
  } catch (err) {
    console.warn('[Notifications] Error requesting permission with async, fallback to callback:', err);
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((permission) => {
          resolve(permission as NotificationPermissionState);
        });
      } catch (e) {
        resolve('denied');
      }
    });
  }
  return 'default';
}

// Synthesize pleasant sound chimes using Web Audio API (zero external assets needed)
export function playNotificationSound(type: 'new_booking' | 'proximity_reminder' | 'success' | 'alert' = 'new_booking') {
  const prefs = getNotificationPreferences();
  if (!prefs.soundEnabled) return;
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'new_booking') {
      // Upbeat barbershop bell chime: D5 (587Hz) -> G5 (784Hz) -> B5 (987Hz) -> D6 (1175Hz)
      const notes = [
        { freq: 587.33, start: 0.0, dur: 0.18 },
        { freq: 783.99, start: 0.12, dur: 0.22 },
        { freq: 987.77, start: 0.24, dur: 0.28 },
        { freq: 1174.66, start: 0.38, dur: 0.45 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.25, now + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } else if (type === 'proximity_reminder') {
      // Elegant clock chime / pocket-watch bell: A4 (440Hz) -> C#5 (554Hz) -> E5 (659Hz) -> A5 (880Hz)
      const notes = [
        { freq: 440.0, start: 0.0, dur: 0.25 },
        { freq: 554.37, start: 0.15, dur: 0.25 },
        { freq: 659.25, start: 0.3, dur: 0.3 },
        { freq: 880.0, start: 0.48, dur: 0.6 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.2, now + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } else if (type === 'alert') {
      // Soft gentle double ping
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        gain.gain.setValueAtTime(0.2, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.25);
      });
    } else {
      // Success chord
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.18, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    }
  } catch (err) {
    console.warn('[Notifications] Web Audio chime could not play:', err);
  }
}

// In-App Toast Event System for visual synchronization
export interface ToastNotificationPayload {
  id: string;
  title: string;
  body: string;
  iconType: 'barber' | 'client' | 'reminder' | 'cancel' | 'success';
  timestamp: string;
  durationMs?: number;
  onClick?: () => void;
}

type ToastListener = (toast: ToastNotificationPayload) => void;
const toastListeners: Set<ToastListener> = new Set();

export function subscribeToInAppToasts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

export function emitInAppToast(toast: Omit<ToastNotificationPayload, 'id' | 'timestamp'>) {
  const payload: ToastNotificationPayload = {
    ...toast,
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    durationMs: toast.durationMs || 6000,
  };
  toastListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.warn('[Notifications] Error in toast listener:', e);
    }
  });
}

// Send native Push Notification
export interface SendPushNotificationOptions {
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  soundType?: 'new_booking' | 'proximity_reminder' | 'success' | 'alert';
  iconType?: 'barber' | 'client' | 'reminder' | 'cancel' | 'success';
  data?: any;
  onClick?: () => void;
}

export function sendPushNotification(title: string, options: SendPushNotificationOptions): boolean {
  const prefs = getNotificationPreferences();

  // 1. Always play audio chime if sound is enabled
  playNotificationSound(options.soundType || 'new_booking');

  // 2. Trigger mobile vibration if supported
  if (prefs.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([180, 80, 180]);
    } catch {}
  }

  // 3. Emit in-app floating banner for instant visual feedback
  emitInAppToast({
    title,
    body: options.body,
    iconType: options.iconType || 'barber',
    onClick: options.onClick,
  });

  // 4. Send OS / Browser native push notification if permission is granted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const defaultIcon = '/barber_clock_logo.jpg';
      const notif = new Notification(title, {
        body: options.body,
        icon: options.icon || defaultIcon,
        badge: options.badge || defaultIcon,
        tag: options.tag || `notif-${Date.now()}`,
        requireInteraction: false,
        silent: false,
      } as any);

      notif.onclick = () => {
        try {
          window.focus();
          if (options.onClick) {
            options.onClick();
          }
          notif.close();
        } catch {}
      };

      // Auto close after 8 seconds on desktop OS
      setTimeout(() => {
        try {
          notif.close();
        } catch {}
      }, 8000);

      return true;
    } catch (err) {
      console.warn('[Notifications] Failed to create native Notification:', err);
    }
  }

  return false;
}

// Check and manage sent proximity reminders in localStorage to avoid spamming
export function hasReminderBeenSent(appointmentId: string, reminderKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_KEY);
    if (!raw) return false;
    const sentMap = JSON.parse(raw);
    return Boolean(sentMap[`${appointmentId}_${reminderKey}`]);
  } catch {
    return false;
  }
}

export function markReminderAsSent(appointmentId: string, reminderKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_KEY);
    const sentMap = raw ? JSON.parse(raw) : {};
    sentMap[`${appointmentId}_${reminderKey}`] = Date.now();
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sentMap));
  } catch {}
}

/**
 * 💈 1. Notify Barber: New Appointment Received
 */
export function notifyBarberNewBooking(
  appointment: Appointment,
  barbershopName?: string,
  onOpenSchedule?: () => void
): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs.barberNewBookingAlert) return false;

  const title = '💈 Novo Agendamento Recebido!';
  const formattedDate = formatDateBr(appointment.date);
  const paymentText = appointment.paymentMethod === 'pix' ? 'PIX' : 'Presencial';

  const body = `Cliente: ${appointment.clientName}\n✂️ Serviço: ${appointment.serviceName}\n📅 ${formattedDate} às ${appointment.time} • ${formatCurrency(appointment.servicePrice)} (${paymentText})`;

  return sendPushNotification(title, {
    body,
    tag: `barber-new-booking-${appointment.id}`,
    soundType: 'new_booking',
    iconType: 'barber',
    onClick: onOpenSchedule,
  });
}

/**
 * ✂️ 2. Notify Client: Booking Confirmed
 */
export function notifyClientBookingConfirmed(
  appointment: Appointment,
  barbershopName?: string,
  onOpenMyAppointments?: () => void
): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs.clientProximityAlert) return false;

  const title = ' Agendamento Confirmado!';
  const formattedDate = formatDateBr(appointment.date);
  const shop = barbershopName || 'BarberClock';

  const body = `Olá ${appointment.clientName}! Seu horário na ${shop} para ${appointment.serviceName} está confirmado para ${formattedDate} às ${appointment.time}.`;

  return sendPushNotification(title, {
    body,
    tag: `client-confirmed-${appointment.id}`,
    soundType: 'success',
    iconType: 'client',
    onClick: onOpenMyAppointments,
  });
}

/**
 * ⏰ 3. Notify Client: Proximity Reminder (e.g. 15 min, 30 min, 1h before)
 */
export function notifyClientProximity(
  appointment: Appointment,
  minutesLeft: number,
  barbershopName?: string,
  onOpenMyAppointments?: () => void
): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs.clientProximityAlert) return false;

  const shop = barbershopName || 'BarberClock';
  const minutesLabel = minutesLeft <= 1 ? 'menos de 1 minuto' : `${minutesLeft} minutos`;
  const title = `⏰ Lembrete: Seu horário na barbearia está próximo!`;
  const body = `Faltam ${minutesLabel} para o seu corte de ${appointment.serviceName} na ${shop} (${appointment.time}). Prepare-se!`;

  return sendPushNotification(title, {
    body,
    tag: `client-proximity-${appointment.id}-${minutesLeft}`,
    soundType: 'proximity_reminder',
    iconType: 'reminder',
    onClick: onOpenMyAppointments,
  });
}

/**
 * ❌ 4. Notify Appointment Cancellation
 */
export function notifyAppointmentCancellation(
  appointment: Appointment,
  cancelledBy: 'barber' | 'client',
  onOpenView?: () => void
): boolean {
  const title = cancelledBy === 'barber' ? '⚠️ Agendamento Cancelado pelo Barbeiro' : '⚠️ Cancelamento de Horário';
  const body = `${appointment.clientName} - ${appointment.serviceName} às ${appointment.time} em ${formatDateBr(appointment.date)}.`;

  return sendPushNotification(title, {
    body,
    tag: `cancel-${appointment.id}`,
    soundType: 'alert',
    iconType: 'cancel',
    onClick: onOpenView,
  });
}

/**
 * 🔔 5. Test Notification
 */
export function sendTestNotification(
  role: 'barber' | 'client',
  onAction?: () => void
): boolean {
  if (role === 'barber') {
    const title = '💈 Teste de Notificação: Novo Agendamento';
    const body = 'Cliente: Carlos Silva\n✂️ Barba & Cabelo Degradê\n📅 Hoje às 15:30 • R$ 65,00 (PIX)';
    return sendPushNotification(title, {
      body,
      tag: `test-barber-${Date.now()}`,
      soundType: 'new_booking',
      iconType: 'barber',
      onClick: onAction,
    });
  } else {
    const title = '⏰ Teste de Lembrete: Seu horário está próximo!';
    const body = 'Faltam 30 minutos para o seu atendimento com Barbeiro Lucas às 16:00 na BarberClock. Chegue com 5 minutos de antecedência!';
    return sendPushNotification(title, {
      body,
      tag: `test-client-${Date.now()}`,
      soundType: 'proximity_reminder',
      iconType: 'reminder',
      onClick: onAction,
    });
  }
}

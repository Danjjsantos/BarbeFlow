import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment } from '../types';
import {
  notifyBarberNewBooking,
  notifyClientProximity,
  notifyClientBookingConfirmed,
  hasReminderBeenSent,
  markReminderAsSent,
  getNotificationPreferences,
} from '../utils/notifications';
import { cleanPhone } from '../utils/formatters';

export function useNotificationWatcher() {
  const {
    currentUser,
    appointments,
    barbershops,
    getBarbershopById,
    currentView,
    activeBarbershopId,
    setActiveBarberTab,
    setCurrentView,
  } = useApp();

  const knownAptIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // 1. Barber Notification Watcher: Detect new appointments in real-time
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'barber') {
      // If not barber, just keep track of existing IDs
      knownAptIdsRef.current = new Set(appointments.map((a) => a.id));
      return;
    }

    const barberShopId = currentUser.barbershopId;
    if (!barberShopId) return;

    // Filter appointments for this barber's shop
    const shopAppointments = appointments.filter((a) => a.barbershopId === barberShopId);

    // If first load, seed the known IDs set
    if (!initialLoadDoneRef.current) {
      knownAptIdsRef.current = new Set(shopAppointments.map((a) => a.id));
      initialLoadDoneRef.current = true;
      return;
    }

    // Check for newly added appointments
    shopAppointments.forEach((apt) => {
      if (!knownAptIdsRef.current.has(apt.id)) {
        knownAptIdsRef.current.add(apt.id);

        // Only notify if appointment was created recently (within last 30 minutes) or is active
        const createdMs = new Date(apt.createdAt).getTime();
        const isRecent = isNaN(createdMs) || Date.now() - createdMs < 30 * 60 * 1000;

        if (isRecent && (apt.status === 'confirmed' || apt.status === 'pending_pix')) {
          const shop = getBarbershopById(barberShopId);
          notifyBarberNewBooking(apt, shop?.name, () => {
            setCurrentView('barber_dashboard');
            setActiveBarberTab('schedule');
          });
        }
      }
    });
  }, [appointments, currentUser, getBarbershopById, setCurrentView, setActiveBarberTab]);

  // 2. Client & Barber Proximity Reminder Watcher: Periodically checks upcoming appointments
  useEffect(() => {
    const checkProximityReminders = () => {
      const prefs = getNotificationPreferences();
      if (!prefs.clientProximityAlert) return;

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      // Determine client phone filters
      let relevantAppointments: Appointment[] = [];

      if (currentUser && currentUser.role === 'client' && currentUser.phone) {
        const myCleanPhone = cleanPhone(currentUser.phone);
        relevantAppointments = appointments.filter(
          (a) => a.status === 'confirmed' && cleanPhone(a.clientPhone).includes(myCleanPhone)
        );
      } else if (currentUser && currentUser.role === 'barber' && currentUser.barbershopId) {
        // Also alert barber of imminent upcoming appointments today
        relevantAppointments = appointments.filter(
          (a) => a.status === 'confirmed' && a.barbershopId === currentUser.barbershopId
        );
      } else {
        // Look in recent bookings for this browser session
        try {
          const recentClientPhone = localStorage.getItem('barberclock_last_client_phone') || '';
          if (recentClientPhone) {
            const clean = cleanPhone(recentClientPhone);
            relevantAppointments = appointments.filter(
              (a) => a.status === 'confirmed' && cleanPhone(a.clientPhone).includes(clean)
            );
          }
        } catch {}
      }

      if (relevantAppointments.length === 0) return;

      const reminderWindow = prefs.proximityMinutes || 30; // e.g. 30 minutes

      relevantAppointments.forEach((apt) => {
        // Check if appointment is today
        if (apt.date !== todayStr) return;

        // Parse appointment time "HH:mm"
        const [aptHour, aptMin] = apt.time.split(':').map(Number);
        if (isNaN(aptHour) || isNaN(aptMin)) return;

        const aptTotalMinutes = aptHour * 60 + aptMin;
        const minutesDiff = aptTotalMinutes - currentTotalMinutes;

        // If appointment is within the reminder window (e.g. between 0 and 30 minutes from now)
        if (minutesDiff >= 0 && minutesDiff <= reminderWindow) {
          const reminderKey = `proximity_${reminderWindow}`;
          if (!hasReminderBeenSent(apt.id, reminderKey)) {
            markReminderAsSent(apt.id, reminderKey);

            const shop = getBarbershopById(apt.barbershopId);
            notifyClientProximity(apt, minutesDiff, shop?.name, () => {
              if (currentUser?.role === 'barber') {
                setCurrentView('barber_dashboard');
                setActiveBarberTab('schedule');
              } else {
                setCurrentView('client_appointments');
              }
            });
          }
        }
      });
    };

    // Run proximity check immediately and then every 25 seconds
    checkProximityReminders();
    const interval = setInterval(checkProximityReminders, 25000);

    return () => clearInterval(interval);
  }, [appointments, currentUser, getBarbershopById, setCurrentView, setActiveBarberTab]);
}

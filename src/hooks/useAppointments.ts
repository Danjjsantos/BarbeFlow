import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, AppointmentStatus } from '../types';
import { getSupabaseClient, supabaseService, isSupabaseConfigured } from '../lib/supabase';
import { generateId } from '../utils/formatters';

export interface UseAppointmentsOptions {
  barbershopId?: string;
  clientPhone?: string;
  autoFetch?: boolean;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { barbershopId, clientPhone, autoFetch = true } = options;
  const {
    appointments: globalAppointments,
    setAppointments: setGlobalAppointments,
    createAppointment: contextCreateAppointment,
    cancelAppointment: contextCancelAppointment,
    confirmAppointmentPix: contextConfirmAppointmentPix,
    completeAppointment: contextCompleteAppointment,
    updateAppointmentStatus: contextUpdateAppointmentStatus,
    deleteAppointment: contextDeleteAppointment,
    currentUser,
    isSupabaseActive,
  } = useApp();

  const [loading, setLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(globalAppointments);

  // Sync local appointments with context appointments
  useEffect(() => {
    setLocalAppointments(globalAppointments);
  }, [globalAppointments]);

  // Fetch appointments directly from Supabase table 'appointments'
  const fetchAppointments = useCallback(
    async (shopId?: string): Promise<Appointment[]> => {
      setLoading(true);
      setError(null);
      try {
        const targetShopId = shopId || barbershopId;
        const client = getSupabaseClient();

        if (client && isSupabaseConfigured()) {
          let query = client
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false });

          if (targetShopId) {
            query = query.eq('barbershop_id', targetShopId);
          }

          const { data, error: sbError } = await query;
          if (sbError) {
            console.warn('[useAppointments] Supabase query error, falling back to service:', sbError);
            const remoteData = await supabaseService.getAppointments();
            if (remoteData) {
              setGlobalAppointments(remoteData);
              const filtered = targetShopId
                ? remoteData.filter((a) => a.barbershopId === targetShopId)
                : remoteData;
              setLocalAppointments(filtered);
              return filtered;
            }
          } else if (data) {
            const mappedAppointments: Appointment[] = data.map((row: any) => ({
              id: row.id,
              barbershopId: row.barbershop_id,
              barberName: row.barber_name,
              clientName: row.client_name,
              clientPhone: row.client_phone,
              serviceId: row.service_id,
              serviceName: row.service_name,
              servicePrice: Number(row.service_price) || 0,
              durationMinutes: Number(row.duration_minutes) || 30,
              date: row.date,
              time: row.time,
              status: row.status as AppointmentStatus,
              pixKeyUsed: row.pix_key_used || '',
              pixTransactionCode: row.pix_transaction_code || '',
              pixPaidAt: row.pix_paid_at || undefined,
              mercadoPagoPaymentId: row.mercado_pago_payment_id || undefined,
              notes: row.notes || undefined,
              cancellationReason: row.cancellation_reason || undefined,
              cancelledBy: row.cancelled_by || undefined,
              cancelledAt: row.cancelled_at || undefined,
              paymentMethod: row.payment_method || 'pix',
              createdAt: row.created_at || new Date().toISOString(),
            }));

            // Merge with global state to preserve other shops' appointments
            setGlobalAppointments((prev) => {
              if (!targetShopId) return mappedAppointments;
              const others = prev.filter((a) => a.barbershopId !== targetShopId);
              return [...mappedAppointments, ...others];
            });

            setLocalAppointments(mappedAppointments);
            return mappedAppointments;
          }
        }

        // Fallback to service method
        const fallbackData = await supabaseService.getAppointments();
        if (fallbackData) {
          setGlobalAppointments(fallbackData);
          const filtered = targetShopId
            ? fallbackData.filter((a) => a.barbershopId === targetShopId)
            : fallbackData;
          setLocalAppointments(filtered);
          return filtered;
        }

        return globalAppointments;
      } catch (err: any) {
        const msg = err?.message || 'Falha ao carregar agendamentos do Supabase';
        setError(msg);
        console.warn('[useAppointments] Fetch error:', err);
        return globalAppointments;
      } finally {
        setLoading(false);
      }
    },
    [barbershopId, globalAppointments, setGlobalAppointments]
  );

  // Fetch appointments for specific client phone
  const fetchAppointmentsByClient = useCallback(
    async (phone: string): Promise<Appointment[]> => {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone) return [];

      setLoading(true);
      setError(null);
      try {
        const client = getSupabaseClient();
        if (client && isSupabaseConfigured()) {
          const { data, error: sbError } = await client
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false });

          if (!sbError && data) {
            const mapped: Appointment[] = data
              .map((row: any) => ({
                id: row.id,
                barbershopId: row.barbershop_id,
                barberName: row.barber_name,
                clientName: row.client_name,
                clientPhone: row.client_phone,
                serviceId: row.service_id,
                serviceName: row.service_name,
                servicePrice: Number(row.service_price) || 0,
                durationMinutes: Number(row.duration_minutes) || 30,
                date: row.date,
                time: row.time,
                status: row.status as AppointmentStatus,
                pixKeyUsed: row.pix_key_used || '',
                pixTransactionCode: row.pix_transaction_code || '',
                pixPaidAt: row.pix_paid_at || undefined,
                mercadoPagoPaymentId: row.mercado_pago_payment_id || undefined,
                notes: row.notes || undefined,
                cancellationReason: row.cancellation_reason || undefined,
                cancelledBy: row.cancelled_by || undefined,
                cancelledAt: row.cancelled_at || undefined,
                paymentMethod: row.payment_method || 'pix',
                createdAt: row.created_at || new Date().toISOString(),
              }))
              .filter((apt) => apt.clientPhone.replace(/\D/g, '').includes(cleanPhone));

            return mapped;
          }
        }

        // Context fallback
        return globalAppointments.filter(
          (apt) => apt.clientPhone.replace(/\D/g, '').includes(cleanPhone)
        );
      } catch (err: any) {
        setError(err?.message || 'Erro ao buscar agendamentos do cliente');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [globalAppointments]
  );

  // Create new appointment and immediately persist to Supabase & local DB
  const createAppointment = useCallback(
    async (
      data: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'pixTransactionCode'> & {
        status?: AppointmentStatus;
      }
    ): Promise<{ success: boolean; appointment?: Appointment; error?: string }> => {
      setIsCreating(true);
      setError(null);
      try {
        const newAppointment: Appointment = {
          ...data,
          id: generateId('apt'),
          status: data.status || 'pending_pix',
          pixTransactionCode: `PIX-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: new Date().toISOString(),
        };

        // 1. Direct Supabase write
        const savedToSupabase = await supabaseService.upsertAppointment(newAppointment);

        // 2. Global context update (and server database sync)
        setGlobalAppointments((prev) => [newAppointment, ...prev.filter((a) => a.id !== newAppointment.id)]);
        setLocalAppointments((prev) => [newAppointment, ...prev.filter((a) => a.id !== newAppointment.id)]);

        // 3. Keep client profile updated if logged in
        if (currentUser && currentUser.role === 'client') {
          if (currentUser.name !== data.clientName || currentUser.phone !== data.clientPhone) {
            const updatedUser = { ...currentUser, name: data.clientName, phone: data.clientPhone };
            supabaseService.upsertUser(updatedUser);
          }
        }

        return {
          success: true,
          appointment: newAppointment,
        };
      } catch (err: any) {
        const msg = err?.message || 'Falha ao salvar agendamento no Supabase';
        setError(msg);
        console.error('[useAppointments] createAppointment error:', err);
        return { success: false, error: msg };
      } finally {
        setIsCreating(false);
      }
    },
    [currentUser, setGlobalAppointments]
  );

  // Confirm PIX payment
  const confirmAppointmentPix = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        contextConfirmAppointmentPix(id);
        const target = globalAppointments.find((a) => a.id === id);
        if (target) {
          const now = new Date();
          const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const updated: Appointment = {
            ...target,
            status: 'confirmed',
            pixPaidAt: formattedDate,
          };
          await supabaseService.upsertAppointment(updated);
        }
        return true;
      } catch (err: any) {
        setError(err?.message || 'Erro ao confirmar agendamento');
        return false;
      }
    },
    [contextConfirmAppointmentPix, globalAppointments]
  );

  // Cancel appointment
  const cancelAppointment = useCallback(
    async (id: string, reason?: string, cancelledBy: 'barber' | 'client' = 'barber'): Promise<boolean> => {
      try {
        contextCancelAppointment(id, reason, cancelledBy);
        const target = globalAppointments.find((a) => a.id === id);
        if (target) {
          const now = new Date();
          const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const updated: Appointment = {
            ...target,
            status: 'cancelled',
            cancellationReason: reason || 'Cancelado',
            cancelledBy,
            cancelledAt: formattedDate,
            notes: reason
              ? `${target.notes ? target.notes + ' • ' : ''}[Cancelado por ${cancelledBy === 'barber' ? 'Barbeiro' : 'Cliente'}: ${reason}]`
              : target.notes,
          };
          await supabaseService.upsertAppointment(updated);
        }
        return true;
      } catch (err: any) {
        setError(err?.message || 'Erro ao cancelar agendamento');
        return false;
      }
    },
    [contextCancelAppointment, globalAppointments]
  );

  // Complete appointment
  const completeAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        contextCompleteAppointment(id);
        const target = globalAppointments.find((a) => a.id === id);
        if (target) {
          const updated: Appointment = { ...target, status: 'completed' };
          await supabaseService.upsertAppointment(updated);
        }
        return true;
      } catch (err: any) {
        setError(err?.message || 'Erro ao concluir agendamento');
        return false;
      }
    },
    [contextCompleteAppointment, globalAppointments]
  );

  // Update status
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus): Promise<boolean> => {
      try {
        contextUpdateAppointmentStatus(id, status);
        const target = globalAppointments.find((a) => a.id === id);
        if (target) {
          const updated: Appointment = { ...target, status };
          await supabaseService.upsertAppointment(updated);
        }
        return true;
      } catch (err: any) {
        setError(err?.message || 'Erro ao atualizar status');
        return false;
      }
    },
    [contextUpdateAppointmentStatus, globalAppointments]
  );

  // Delete appointment
  const deleteAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        contextDeleteAppointment(id);
        await supabaseService.deleteAppointment(id);
        return true;
      } catch (err: any) {
        setError(err?.message || 'Erro ao excluir agendamento');
        return false;
      }
    },
    [contextDeleteAppointment]
  );

  // Filtered appointments helper
  const filteredAppointments = localAppointments.filter((apt) => {
    if (barbershopId && apt.barbershopId !== barbershopId) return false;
    if (clientPhone) {
      const cleanFilterPhone = clientPhone.replace(/\D/g, '');
      const cleanAptPhone = apt.clientPhone.replace(/\D/g, '');
      if (!cleanAptPhone.includes(cleanFilterPhone)) return false;
    }
    return true;
  });

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch) {
      fetchAppointments(barbershopId);
    }
  }, [autoFetch, barbershopId, fetchAppointments]);

  // Realtime subscription to appointments table
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return;

    try {
      const channel = client
        .channel('appointments_live_hook')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          (payload: any) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newRow = payload.new;
              const newApt: Appointment = {
                id: newRow.id,
                barbershopId: newRow.barbershop_id,
                barberName: newRow.barber_name,
                clientName: newRow.client_name,
                clientPhone: newRow.client_phone,
                serviceId: newRow.service_id,
                serviceName: newRow.service_name,
                servicePrice: Number(newRow.service_price) || 0,
                durationMinutes: Number(newRow.duration_minutes) || 30,
                date: newRow.date,
                time: newRow.time,
                status: newRow.status,
                pixKeyUsed: newRow.pix_key_used || '',
                pixTransactionCode: newRow.pix_transaction_code || '',
                pixPaidAt: newRow.pix_paid_at || undefined,
                mercadoPagoPaymentId: newRow.mercado_pago_payment_id || undefined,
                notes: newRow.notes || undefined,
                cancellationReason: newRow.cancellation_reason || undefined,
                cancelledBy: newRow.cancelled_by || undefined,
                cancelledAt: newRow.cancelled_at || undefined,
                paymentMethod: newRow.payment_method || 'pix',
                createdAt: newRow.created_at || new Date().toISOString(),
              };
              setGlobalAppointments((prev) => [newApt, ...prev.filter((a) => a.id !== newApt.id)]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedRow = payload.new;
              setGlobalAppointments((prev) =>
                prev.map((a) =>
                  a.id === updatedRow.id
                    ? {
                        ...a,
                        status: updatedRow.status,
                        pixPaidAt: updatedRow.pix_paid_at || a.pixPaidAt,
                        notes: updatedRow.notes || a.notes,
                        cancellationReason: updatedRow.cancellation_reason || a.cancellationReason,
                        cancelledBy: updatedRow.cancelled_by || a.cancelledBy,
                        cancelledAt: updatedRow.cancelled_at || a.cancelledAt,
                      }
                    : a
                )
              );
            } else if (payload.eventType === 'DELETE' && payload.old?.id) {
              const deletedId = payload.old.id;
              setGlobalAppointments((prev) => prev.filter((a) => a.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[useAppointments] Realtime subscription error:', e);
    }
  }, [setGlobalAppointments]);

  return {
    appointments: filteredAppointments,
    allAppointments: localAppointments,
    loading,
    isLoading: loading,
    isCreating,
    error,
    fetchAppointments,
    fetchAppointmentsByClient,
    createAppointment,
    confirmAppointmentPix,
    cancelAppointment,
    completeAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    refresh: () => fetchAppointments(barbershopId),
    reload: () => fetchAppointments(barbershopId),
  };
}

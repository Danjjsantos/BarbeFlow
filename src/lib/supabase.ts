import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Barbershop,
  Service,
  Appointment,
  User,
  SubscriptionPlan,
  PlatformSettings,
  LandingPageContent,
} from '../types';

// Read Vite client-side environment variables safely
const metaEnv = (import.meta as any).env || {};
const supabaseUrl: string = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      supabaseAnonKey.length > 20
  );
};

// Singleton Supabase Client
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// SUPABASE DATA LAYER & SYNC SERVICES
// ==========================================

export const supabaseService = {
  // Check health and connectivity
  async checkConnection(): Promise<{ connected: boolean; message: string }> {
    if (!supabase) {
      return {
        connected: false,
        message: 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas.',
      };
    }

    try {
      const { data, error } = await supabase.from('barbershops').select('id').limit(1);
      if (error) {
        return {
          connected: false,
          message: `Erro na tabela do Supabase: ${error.message}`,
        };
      }
      return {
        connected: true,
        message: 'Conectado com sucesso ao Supabase!',
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err?.message || 'Falha na conexão com Supabase.',
      };
    }
  },

  // BARBERSHOPS
  async getBarbershops(): Promise<Barbershop[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('barbershops').select('*');
      if (error) {
        console.warn('Erro ao buscar barbearias do Supabase:', error.message);
        return null;
      }
      return (data || []).map((row: any) => ({
        id: row.id,
        ownerId: row.owner_id || '',
        ownerName: row.owner_name || '',
        ownerPhone: row.owner_phone || '',
        name: row.name,
        slug: row.slug,
        logoUrl: row.logo_url || '',
        bannerUrl: row.banner_url || '',
        phone: row.phone || '',
        address: row.address || '',
        city: row.city || '',
        instagram: row.instagram || '',
        bio: row.bio || '',
        themeColor: row.theme_color || '#d97706',
        pixKey: row.pix_key || '',
        pixKeyType: row.pix_key_type || 'cpf',
        pixReceiverName: row.pix_receiver_name || '',
        subscriptionPlanId: row.subscription_plan_id || 'monthly',
        subscriptionStatus: row.subscription_status || 'active',
        subscriptionMonthlyFee: Number(row.subscription_monthly_fee) || 49.9,
        subscriptionValidUntil: row.subscription_valid_until || '',
        subscriptionProofUrl: row.subscription_proof_url || '',
        subscriptionRequestedAt: row.subscription_requested_at || new Date().toISOString(),
        subscriptionLastPaymentDate: row.subscription_last_payment_date || '',
        workingHours: typeof row.working_hours === 'string' ? JSON.parse(row.working_hours) : (row.working_hours || {}),
        slotIntervalMinutes: Number(row.slot_interval_minutes) || 30,
      }));
    } catch (err) {
      console.warn('Erro getBarbershops:', err);
      return null;
    }
  },

  async upsertBarbershop(shop: Barbershop): Promise<boolean> {
    if (!supabase) return false;
    try {
      const row = {
        id: shop.id,
        owner_id: shop.ownerId,
        owner_name: shop.ownerName,
        owner_phone: shop.ownerPhone,
        name: shop.name,
        slug: shop.slug,
        logo_url: shop.logoUrl,
        banner_url: shop.bannerUrl,
        phone: shop.phone,
        address: shop.address,
        city: shop.city,
        instagram: shop.instagram,
        bio: shop.bio,
        theme_color: shop.themeColor,
        pix_key: shop.pixKey,
        pix_key_type: shop.pixKeyType,
        pix_receiver_name: shop.pixReceiverName,
        subscription_plan_id: shop.subscriptionPlanId,
        subscription_status: shop.subscriptionStatus,
        subscription_monthly_fee: shop.subscriptionMonthlyFee,
        subscription_valid_until: shop.subscriptionValidUntil,
        subscription_proof_url: shop.subscriptionProofUrl,
        subscription_requested_at: shop.subscriptionRequestedAt,
        subscription_last_payment_date: shop.subscriptionLastPaymentDate,
        working_hours: shop.workingHours,
        slot_interval_minutes: shop.slotIntervalMinutes,
      };
      const { error } = await supabase.from('barbershops').upsert(row);
      if (error) {
        console.warn('Erro ao atualizar barbearia no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Erro upsertBarbershop:', err);
      return false;
    }
  },

  // SERVICES
  async getServices(): Promise<Service[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) {
        console.warn('Erro ao buscar serviços do Supabase:', error.message);
        return null;
      }
      return (data || []).map((row: any) => ({
        id: row.id,
        barbershopId: row.barbershop_id,
        name: row.name,
        description: row.description || '',
        price: Number(row.price) || 0,
        durationMinutes: Number(row.duration_minutes) || 30,
        category: row.category || 'cabelo',
        active: Boolean(row.active),
        iconName: row.icon_name,
      }));
    } catch (err) {
      console.warn('Erro getServices:', err);
      return null;
    }
  },

  async upsertService(service: Service): Promise<boolean> {
    if (!supabase) return false;
    try {
      const row = {
        id: service.id,
        barbershop_id: service.barbershopId,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.durationMinutes,
        category: service.category,
        active: service.active,
        icon_name: service.iconName,
      };
      const { error } = await supabase.from('services').upsert(row);
      if (error) {
        console.warn('Erro ao atualizar serviço no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Erro upsertService:', err);
      return false;
    }
  },

  async deleteService(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      return !error;
    } catch (err) {
      console.warn('Erro deleteService:', err);
      return false;
    }
  },

  // APPOINTMENTS
  async getAppointments(): Promise<Appointment[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      if (error) {
        console.warn('Erro ao buscar agendamentos do Supabase:', error.message);
        return null;
      }
      return (data || []).map((row: any) => ({
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
        status: row.status,
        pixKeyUsed: row.pix_key_used || '',
        pixTransactionCode: row.pix_transaction_code || '',
        pixPaidAt: row.pix_paid_at,
        notes: row.notes,
        cancellationReason: row.cancellation_reason,
        cancelledBy: row.cancelled_by,
        cancelledAt: row.cancelled_at,
        paymentMethod: row.payment_method || 'pix',
        createdAt: row.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Erro getAppointments:', err);
      return null;
    }
  },

  async upsertAppointment(appt: Appointment): Promise<boolean> {
    if (!supabase) return false;
    try {
      const row = {
        id: appt.id,
        barbershop_id: appt.barbershopId,
        barber_name: appt.barberName,
        client_name: appt.clientName,
        client_phone: appt.clientPhone,
        service_id: appt.serviceId,
        service_name: appt.serviceName,
        service_price: appt.servicePrice,
        duration_minutes: appt.durationMinutes,
        date: appt.date,
        time: appt.time,
        status: appt.status,
        pix_key_used: appt.pixKeyUsed,
        pix_transaction_code: appt.pixTransactionCode,
        pix_paid_at: appt.pixPaidAt,
        notes: appt.notes,
        cancellation_reason: appt.cancellationReason,
        cancelled_by: appt.cancelledBy,
        cancelled_at: appt.cancelledAt,
        payment_method: appt.paymentMethod,
        created_at: appt.createdAt,
      };
      const { error } = await supabase.from('appointments').upsert(row);
      if (error) {
        console.warn('Erro ao salvar agendamento no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Erro upsertAppointment:', err);
      return false;
    }
  },

  // USERS
  async getUsers(): Promise<User[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.warn('Erro ao buscar usuários do Supabase:', error.message);
        return null;
      }
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        password: row.password,
        role: row.role,
        barbershopId: row.barbershop_id,
        avatarUrl: row.avatar_url,
      }));
    } catch (err) {
      console.warn('Erro getUsers:', err);
      return null;
    }
  },

  async upsertUser(user: User): Promise<boolean> {
    if (!supabase) return false;
    try {
      const row = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        password: user.password,
        role: user.role,
        barbershop_id: user.barbershopId,
        avatar_url: user.avatarUrl,
      };
      const { error } = await supabase.from('users').upsert(row);
      return !error;
    } catch (err) {
      console.warn('Erro upsertUser:', err);
      return false;
    }
  },

  // Real-time listener registration
  subscribeToChanges(onAppointmentChange?: () => void, onBarbershopChange?: () => void) {
    if (!supabase) return () => {};

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          if (onAppointmentChange) onAppointmentChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barbershops' },
        () => {
          if (onBarbershopChange) onBarbershopChange();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  },
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Barbershop,
  Service,
  Appointment,
  PlatformSettings,
  AppointmentStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionPlanPeriod,
  LandingPageContent,
  TrialUserRecord,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_BARBERSHOPS,
  INITIAL_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_PLATFORM_SETTINGS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_LANDING_CONTENT,
  INITIAL_TRIAL_RECORDS,
} from '../data/initialData';
import { generateId, getTodayDateString, formatPhone } from '../utils/formatters';
import { parseVideoUrl } from '../utils/videoUtils';
import { supabaseService, isSupabaseConfigured, fetchServerDbData, saveToServerDb, syncAllToServerDb } from '../lib/supabase';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  barbershops: Barbershop[];
  services: Service[];
  appointments: Appointment[];
  platformSettings: PlatformSettings;
  subscriptionPlans: SubscriptionPlan[];
  landingPageContent: LandingPageContent;
  trialRecords: TrialUserRecord[];
  activeBarbershopId: string;
  setActiveBarbershopId: (id: string) => void;
  currentView: 'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page';
  setCurrentView: (view: 'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page') => void;
  activeBarberTab: 'schedule' | 'financial' | 'services' | 'settings';
  setActiveBarberTab: (tab: 'schedule' | 'financial' | 'services' | 'settings') => void;
  isBarberDrawerOpen: boolean;
  setIsBarberDrawerOpen: (isOpen: boolean) => void;
  newAppointmentsCount: number;
  markAppointmentsAsSeen: () => void;
  switchRole: (role: 'client' | 'barber' | 'super_admin') => void;

  // Supabase Status & Sync
  isSupabaseActive: boolean;
  supabaseStatus: { connected: boolean; message: string };
  checkSupabaseConnection: () => Promise<void>;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string }>;

  // Registration Modal State
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (isOpen: boolean) => void;
  registerPlanId: string;
  setRegisterPlanId: (planId: string) => void;
  openRegisterModal: (planId?: string) => void;

  // Login Modal State & Auth
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  loginModalRole: 'barber' | 'super_admin';
  setLoginModalRole: (role: 'barber' | 'super_admin') => void;
  openLoginModal: (role?: 'barber' | 'super_admin') => void;
  loginUser: (identifier: string, pass: string) => { success: boolean; message?: string; user?: User };
  updateUserPassword: (userId: string, newPassword: string) => { success: boolean; message: string };
  updateUserProfile: (userId: string, updates: Partial<User>) => { success: boolean; message: string };
  logoutUser: () => void;
  
  // Client & Barber Actions
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'pixTransactionCode'> & { status?: AppointmentStatus }) => Appointment;
  cancelAppointment: (id: string, reason?: string, cancelledBy?: 'barber' | 'client') => void;
  deleteAppointment: (id: string) => void;
  
  // Barber Actions
  confirmAppointmentPix: (id: string, proofUrl?: string, transactionCode?: string) => void;
  completeAppointment: (id: string) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  updateBarbershop: (id: string, updates: Partial<Barbershop>) => void;
  submitSubscriptionPaymentProof: (barbershopId: string, proofNote: string) => void;
  
  // Super Admin Actions
  approveBarbershopSubscription: (barbershopId: string, daysValid?: number, upgradedPlanId?: SubscriptionPlanPeriod) => void;
  rejectBarbershopSubscription: (barbershopId: string) => void;
  updateBarbershopSubscriptionStatus: (barbershopId: string, status: SubscriptionStatus) => void;
  deleteBarbershop: (id: string) => void;
  deleteTrialRecord: (id: string) => void;
  deleteUserAccount: (id: string) => void;
  clearAllDemoData: () => void;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
  fetchPlatformSettings: () => Promise<PlatformSettings | null>;
  updateSubscriptionPlan: (id: SubscriptionPlanPeriod, updates: Partial<SubscriptionPlan>) => void;
  updateLandingPageContent: (updates: Partial<LandingPageContent>) => void;
  registerNewBarbershop: (data: {
    barberName: string;
    phone: string;
    email?: string;
    password?: string;
    shopName: string;
    address: string;
    city: string;
    pixKey: string;
    pixKeyType: any;
    themeColor?: string;
    bio?: string;
    planId?: SubscriptionPlanPeriod;
  }) => Barbershop;

  // Trial and Expiration Helpers
  checkTrialEligibility: (name: string, phone: string, email?: string) => { isEligible: boolean; reason?: string; matchedField?: 'email' | 'phone' | 'name' };
  isSubscriptionExpired: (barbershop: Barbershop) => boolean;
  getRemainingDays: (validUntil: string) => number;

  // Helpers
  getBarbershopById: (id: string) => Barbershop | undefined;
  getServicesForBarbershop: (barbershopId: string) => Service[];
  getAppointmentsForBarbershop: (barbershopId: string) => Appointment[];
  getAppointmentsForClient: (clientPhone: string) => Appointment[];
  resetToDefaultData: () => void;

  // Canonical URL Link Generators
  getBarbershopPublicUrl: (slugOrId?: string) => string;
  getAdminPublicUrl: () => string;
  getBarberPublicUrl: () => string;
  getLandingPublicUrl: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'barberhub_users_v2',
  BARBERSHOPS: 'barberhub_shops_v2',
  SERVICES: 'barberhub_services_v2',
  APPOINTMENTS: 'barberhub_appointments_v2',
  SETTINGS: 'barberhub_settings_v2',
  PLANS: 'barberhub_plans_v2',
  LANDING: 'barberhub_landing_v2',
  TRIAL_RECORDS: 'barberhub_trial_records_v2',
  CURRENT_USER_ID: 'barberhub_current_user_id_v2',
  ACTIVE_SHOP_ID: 'barberhub_active_shop_id_v2',
  CURRENT_VIEW: 'barberhub_view_v2',
  BARBER_TAB: 'barberhub_barber_tab_v2',
  ADMIN_TAB: 'barberhub_admin_tab_v2',
  AUTH_LOGGED_IN: 'barberhub_auth_logged_in_v2',
  CLIENT_SESSION_VIEW: 'barberhub_client_session_view_v2',
  CLIENT_SESSION_SHOP_ID: 'barberhub_client_session_shop_id_v2',
};

// Helper to resolve route and barbershop from URL query params (?view=...)
export const resolveRouteFromUrl = (
  shops: Barbershop[]
): {
  view: 'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page' | null;
  shopId: string | null;
  sub: string | null;
} => {
  if (typeof window === 'undefined') {
    return { view: null, shopId: null, sub: null };
  }

  const params = new URLSearchParams(window.location.search);
  const rawView = params.get('view');
  const shopParam = params.get('shop') || params.get('barbearia');
  const subParam = params.get('sub') || params.get('tab');
  const rawHash = window.location.hash.replace('#', '').trim().toLowerCase();

  // Normalize view parameter string (trim, lowercase, strip accents)
  const normView = rawView
    ? decodeURIComponent(rawView).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : '';

  // 1. Presentation Landing Page (?view=apresentacao or ?view=apresentação)
  if (normView === 'apresentacao' || normView === 'landing' || normView === 'landing_page' || normView === 'home') {
    return { view: 'landing_page', shopId: null, sub: null };
  }

  // 2. Administrator Dashboard (?view=admin)
  if (normView === 'admin' || normView === 'superadmin' || normView === 'super_admin' || normView === 'super_admin_dashboard') {
    return { view: 'super_admin_dashboard', shopId: null, sub: subParam };
  }

  // 3. Barber Dashboard (?view=barber_)
  if (normView === 'barber_' || normView === 'barber' || normView === 'barbeiro' || normView === 'barber_dashboard') {
    return { view: 'barber_dashboard', shopId: null, sub: subParam };
  }

  // 4. Client Appointments (?view=meus-agendamentos or ?view=agendamentos)
  if (normView === 'meus-agendamentos' || normView === 'agendamentos' || normView === 'client_appointments') {
    return { view: 'client_appointments', shopId: null, sub: null };
  }

  // 5. Direct Barbershop Customer Link (?view=nomedabarbearia)
  if (rawView) {
    const decodedSlug = decodeURIComponent(rawView).trim().toLowerCase();
    const matchedShop = shops.find(
      (s) => (s.slug && s.slug.toLowerCase() === decodedSlug) || (s.id && s.id.toLowerCase() === decodedSlug)
    );
    if (matchedShop) {
      return {
        view: subParam === 'meus-agendamentos' ? 'client_appointments' : 'client_booking',
        shopId: matchedShop.id,
        sub: subParam,
      };
    }
    // Check normalized slug without accents
    const decodedSlugNoAccent = decodedSlug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matchedNormalized = shops.find((s) => {
      const sSlugNoAccent = (s.slug || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return sSlugNoAccent === decodedSlugNoAccent;
    });
    if (matchedNormalized) {
      return {
        view: subParam === 'meus-agendamentos' ? 'client_appointments' : 'client_booking',
        shopId: matchedNormalized.id,
        sub: subParam,
      };
    }
  }

  // 6. Secondary ?shop= or ?barbearia= parameter
  if (shopParam) {
    const matchedShop = shops.find(
      (s) => (s.slug && s.slug.toLowerCase() === shopParam.toLowerCase()) || (s.id && s.id.toLowerCase() === shopParam.toLowerCase())
    );
    if (matchedShop) {
      return {
        view: subParam === 'meus-agendamentos' ? 'client_appointments' : 'client_booking',
        shopId: matchedShop.id,
        sub: subParam,
      };
    }
  }

  // 7. Hash fallback (e.g. #navalha-de-ouro)
  if (rawHash) {
    const landingSectionHashes = [
      'planos', 'cadastro', 'apresentacao', 'sobre', 'precos',
      'home', 'landing', 'video-demo', 'diferenciais', 'galeria',
      'calculadora', 'simulador', 'depoimentos', 'faq',
    ];
    if (!landingSectionHashes.includes(rawHash)) {
      const matchedShop = shops.find(
        (s) => (s.slug && s.slug.toLowerCase() === rawHash) || (s.id && s.id.toLowerCase() === rawHash)
      );
      if (matchedShop) {
        return { view: 'client_booking', shopId: matchedShop.id, sub: null };
      }
    }
  }

  return { view: null, shopId: null, sub: null };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved !== null) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Always ensure the Super Admin account exists so admin access is never locked
          const superAdmins = INITIAL_USERS.filter((u) => u.role === 'super_admin');
          const merged = [...parsed];
          superAdmins.forEach((adminUser) => {
            const exists = merged.some(
              (u) => u.email?.toLowerCase() === adminUser.email?.toLowerCase() || u.id === adminUser.id
            );
            if (!exists) {
              merged.push(adminUser);
            }
          });
          return merged;
        }
      } catch {
        // Ignore JSON error
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.AUTH_LOGGED_IN) === 'true';
    const savedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    let parsedUsers: User[] = [];
    if (savedUsersRaw) {
      try {
        parsedUsers = JSON.parse(savedUsersRaw);
      } catch {}
    }
    if (savedId) {
      const foundInSaved = parsedUsers.find((u) => u.id === savedId);
      if (foundInSaved) return foundInSaved;
      const foundInit = INITIAL_USERS.find((u) => u.id === savedId);
      if (foundInit) return foundInit;
    }
    if (isLoggedIn) {
      return parsedUsers.find((u) => u.role === 'super_admin') || INITIAL_USERS[0];
    }
    // Default to client user or first available user when not logged in
    return parsedUsers.find((u) => u.role === 'client') || INITIAL_USERS.find((u) => u.role === 'client') || INITIAL_USERS[0];
  });

  const [barbershops, setBarbershops] = useState<Barbershop[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBERSHOPS);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall back to empty
      }
    }
    return [];
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall back to empty
      }
    }
    return [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall back to empty
      }
    }
    return [];
  });

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return INITIAL_PLATFORM_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_PLATFORM_SETTINGS, ...parsed };
    } catch {
      return INITIAL_PLATFORM_SETTINGS;
    }
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (!saved) return INITIAL_SUBSCRIPTION_PLANS;
    try {
      const parsed: SubscriptionPlan[] = JSON.parse(saved);
      // Ensure 'trial' plan is always present
      const hasTrial = parsed.some((p) => p.id === 'trial');
      if (!hasTrial) {
        const trialPlan = INITIAL_SUBSCRIPTION_PLANS.find((p) => p.id === 'trial');
        if (trialPlan) {
          const merged = [trialPlan, ...parsed];
          localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(merged));
          return merged;
        }
      }
      return parsed;
    } catch {
      return INITIAL_SUBSCRIPTION_PLANS;
    }
  });

  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANDING);
    if (!saved) return INITIAL_LANDING_CONTENT;
    try {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_LANDING_CONTENT, ...parsed };
    } catch {
      return INITIAL_LANDING_CONTENT;
    }
  });

  const [trialRecords, setTrialRecords] = useState<TrialUserRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRIAL_RECORDS);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall back to empty
      }
    }
    return [];
  });

  const [activeBarbershopId, setActiveBarbershopId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shopParam = params.get('shop') || params.get('barbearia');
      if (shopParam) return shopParam;

      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      const landingSectionHashes = [
        'planos', 'cadastro', 'apresentacao', 'sobre', 'precos',
        'home', 'landing', 'video-demo', 'diferenciais', 'galeria',
        'calculadora', 'simulador', 'depoimentos', 'faq',
      ];
      if (hash && !landingSectionHashes.includes(hash)) {
        const savedShopsRaw = localStorage.getItem(STORAGE_KEYS.BARBERSHOPS);
        if (savedShopsRaw) {
          try {
            const parsedShops: Barbershop[] = JSON.parse(savedShopsRaw);
            const found = parsedShops.find((s) => s.slug.toLowerCase() === hash || s.id.toLowerCase() === hash);
            if (found) return found.id;
          } catch {}
        }
        const foundInit = INITIAL_BARBERSHOPS.find((s) => s.slug.toLowerCase() === hash || s.id.toLowerCase() === hash);
        if (foundInit) return foundInit.id;
      }

      // Check client active tab session
      try {
        const sessionShop = sessionStorage.getItem(STORAGE_KEYS.CLIENT_SESSION_SHOP_ID);
        if (sessionShop) return sessionShop;
      } catch {}

      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHOP_ID);
      if (saved) return saved;
    }
    return '';
  });

  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured());
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string }>({
    connected: isSupabaseConfigured(),
    message: isSupabaseConfigured()
      ? 'Supabase configurado e sincronizado'
      : 'Modo local ativo',
  });

  const checkSupabaseConnection = async () => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseActive(false);
      setSupabaseStatus({
        connected: false,
        message: 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não informadas.',
      });
      return;
    }

    const res = await supabaseService.checkConnection();
    setIsSupabaseActive(res.connected);
    setSupabaseStatus(res);
  };

  const syncAllToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    return supabaseService.seedAllToSupabase({
      barbershops,
      services,
      appointments,
      users,
      plans: subscriptionPlans,
      settings: platformSettings,
      trialRecords,
      landing: landingPageContent,
    });
  };

  // Helper function to safely merge lists by unique ID (preserves local records and updates with remote data)
  function mergeById<T extends { id: string }>(remoteList: T[] = [], localList: T[] = []): T[] {
    const map = new Map<string, T>();
    (localList || []).forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    (remoteList || []).forEach((item) => {
      if (item && item.id) {
        const existing = map.get(item.id);
        map.set(item.id, existing ? { ...existing, ...item } : item);
      }
    });
    return Array.from(map.values());
  }

  // Initial Database Hydration (Server disk DB + Supabase) & Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    const hydrateData = async () => {
      try {
        // Read current local storage values before network fetch
        const localShopsRaw = localStorage.getItem(STORAGE_KEYS.BARBERSHOPS);
        const localServicesRaw = localStorage.getItem(STORAGE_KEYS.SERVICES);
        const localAppointmentsRaw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        const localUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        const localTrialsRaw = localStorage.getItem(STORAGE_KEYS.TRIAL_RECORDS);

        const localShops: Barbershop[] = localShopsRaw ? JSON.parse(localShopsRaw) : [];
        const localServices: Service[] = localServicesRaw ? JSON.parse(localServicesRaw) : [];
        const localAppointments: Appointment[] = localAppointmentsRaw ? JSON.parse(localAppointmentsRaw) : [];
        const localUsers: User[] = localUsersRaw ? JSON.parse(localUsersRaw) : [];
        const localTrials: TrialUserRecord[] = localTrialsRaw ? JSON.parse(localTrialsRaw) : [];

        // 1. Fetch server persistent database first (persisted on disk)
        const serverData = await fetchServerDbData();
        if (serverData && isMounted) {
          const mergedShops = mergeById(serverData.barbershops || [], localShops);
          setBarbershops(mergedShops);
          localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(mergedShops));

          const mergedServices = mergeById(serverData.services || [], localServices);
          setServices(mergedServices);
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(mergedServices));

          const mergedAppointments = mergeById(serverData.appointments || [], localAppointments);
          setAppointments(mergedAppointments);
          localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(mergedAppointments));

          const mergedUsers = mergeById(serverData.users || [], localUsers);
          setUsers(mergedUsers);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));
          setCurrentUser((curr) => {
            const fresh = mergedUsers.find((u: User) => u.id === curr.id);
            return fresh || curr;
          });

          if (Array.isArray(serverData.plans) && serverData.plans.length > 0) {
            setSubscriptionPlans(serverData.plans);
            localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(serverData.plans));
          }
          if (serverData.settings) {
            setPlatformSettings((prev) => {
              const merged = { ...prev, ...serverData.settings };
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
              return merged;
            });
          }
          if (serverData.landing && typeof serverData.landing === 'object') {
            setLandingPageContent((prev) => {
              const merged = { ...INITIAL_LANDING_CONTENT, ...prev, ...serverData.landing };
              try {
                localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          const mergedTrials = mergeById(serverData.trialRecords || [], localTrials);
          setTrialRecords(mergedTrials);
          localStorage.setItem(STORAGE_KEYS.TRIAL_RECORDS, JSON.stringify(mergedTrials));

          // If local has entries not in server disk DB, immediately sync them
          if (
            (localShops.length > 0 && (!serverData.barbershops || serverData.barbershops.length < mergedShops.length)) ||
            (localUsers.length > 0 && (!serverData.users || serverData.users.length < mergedUsers.length)) ||
            (localServices.length > 0 && (!serverData.services || serverData.services.length < mergedServices.length))
          ) {
            syncAllToServerDb({
              barbershops: mergedShops,
              services: mergedServices,
              appointments: mergedAppointments,
              users: mergedUsers,
              trialRecords: mergedTrials,
            });
          }
        }

        // 2. If Supabase is configured, also hydrate and sync from Supabase
        if (isSupabaseConfigured()) {
          const [
            remoteShops,
            remoteServices,
            remoteAppointments,
            remoteUsers,
            remotePlans,
            remoteSettings,
            remoteTrials,
            remoteLanding,
          ] = await Promise.all([
            supabaseService.getBarbershops(),
            supabaseService.getServices(),
            supabaseService.getAppointments(),
            supabaseService.getUsers(),
            supabaseService.getSubscriptionPlans(),
            supabaseService.getPlatformSettings(),
            supabaseService.getTrialRecords(),
            supabaseService.getLandingPageContent(),
          ]);

          if (!isMounted) return;

          setBarbershops((curr) => {
            const merged = mergeById(remoteShops || [], curr);
            localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(merged));
            return merged;
          });

          setServices((curr) => {
            const merged = mergeById(remoteServices || [], curr);
            localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(merged));
            return merged;
          });

          setAppointments((curr) => {
            const merged = mergeById(remoteAppointments || [], curr);
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(merged));
            return merged;
          });

          setUsers((curr) => {
            const merged = mergeById(remoteUsers || [], curr);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
            setCurrentUser((currU) => {
              const fresh = merged.find((u: User) => u.id === currU.id);
              return fresh || currU;
            });
            return merged;
          });

          if (remotePlans && remotePlans.length > 0) {
            setSubscriptionPlans(remotePlans);
            localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(remotePlans));
          }
          if (remoteSettings) {
            setPlatformSettings((prev) => {
              const merged = { ...prev, ...remoteSettings };
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
              return merged;
            });
          }
          if (remoteTrials && Array.isArray(remoteTrials) && remoteTrials.length > 0) {
            setTrialRecords((curr) => {
              const merged = mergeById(remoteTrials || [], curr);
              localStorage.setItem(STORAGE_KEYS.TRIAL_RECORDS, JSON.stringify(merged));
              return merged;
            });
          }
          if (remoteLanding) {
            setLandingPageContent((prev) => {
              const merged = { ...INITIAL_LANDING_CONTENT, ...prev, ...remoteLanding };
              try {
                localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }

          setIsSupabaseActive(true);
          setSupabaseStatus({
            connected: true,
            message: 'Conectado em tempo real com o banco de dados Supabase.',
          });
        }
      } catch (err: any) {
        console.warn('Erro na hidratação de dados:', err);
      }
    };

    hydrateData();

    // Subscribe to realtime database changes if Supabase is configured
    if (isSupabaseConfigured()) {
      const unsubscribe = supabaseService.subscribeToChanges(
        async () => {
          const freshAppointments = await supabaseService.getAppointments();
          if (freshAppointments && isMounted) {
            setAppointments((curr) => {
              const merged = mergeById(freshAppointments, curr);
              localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(merged));
              return merged;
            });
          }
        },
        async () => {
          const freshShops = await supabaseService.getBarbershops();
          if (freshShops && isMounted) {
            setBarbershops((curr) => {
              const merged = mergeById(freshShops, curr);
              localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(merged));
              return merged;
            });
          }
        },
        async () => {
          const freshServices = await supabaseService.getServices();
          if (freshServices && isMounted) {
            setServices((curr) => {
              const merged = mergeById(freshServices, curr);
              localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(merged));
              return merged;
            });
          }
        },
        async () => {
          const freshSettings = await supabaseService.getPlatformSettings();
          if (freshSettings && isMounted) {
            setPlatformSettings((prev) => {
              const merged = { ...prev, ...freshSettings };
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
              return merged;
            });
          }
        },
        async () => {
          const freshLanding = await supabaseService.getLandingPageContent();
          if (freshLanding && isMounted) {
            setLandingPageContent((prev) => {
              const merged = { ...prev, ...freshLanding };
              localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(merged));
              return merged;
            });
          }
        },
        async () => {
          const freshPlans = await supabaseService.getSubscriptionPlans();
          if (freshPlans && isMounted && freshPlans.length > 0) {
            setSubscriptionPlans(freshPlans);
            localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(freshPlans));
          }
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }
  }, []);

  const [currentView, setCurrentView] = useState<'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page'>(() => {
    if (typeof window !== 'undefined') {
      let candidateShops: Barbershop[] = INITIAL_BARBERSHOPS;
      const savedShopsRaw = localStorage.getItem(STORAGE_KEYS.BARBERSHOPS);
      if (savedShopsRaw) {
        try {
          const parsed = JSON.parse(savedShopsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) candidateShops = parsed;
        } catch {}
      }

      // 1. If explicit route/view is passed in URL query or hash (?view=admin, ?view=barber_, ?view=nomedabarbearia, ?view=apresentacao)
      const route = resolveRouteFromUrl(candidateShops);
      if (route.view) {
        return route.view;
      }

      // 2. Priority: Check if administrator or barber is authenticated (must remain on panel upon page refresh until explicit logoff)
      const isLoggedIn = localStorage.getItem(STORAGE_KEYS.AUTH_LOGGED_IN) === 'true';
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);

      if (isLoggedIn && savedUserId) {
        let userRole = '';
        const savedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedUsersRaw) {
          try {
            const parsed: User[] = JSON.parse(savedUsersRaw);
            const u = parsed.find((x) => x.id === savedUserId);
            if (u) userRole = u.role;
          } catch {}
        }
        if (!userRole) {
          const u = INITIAL_USERS.find((x) => x.id === savedUserId);
          if (u) userRole = u.role;
        }

        const savedView = localStorage.getItem(STORAGE_KEYS.CURRENT_VIEW) as any;
        if (userRole === 'super_admin') {
          return savedView === 'client_booking' || savedView === 'client_appointments' ? savedView : 'super_admin_dashboard';
        }
        if (userRole === 'barber') {
          return savedView === 'client_booking' || savedView === 'client_appointments' ? savedView : 'barber_dashboard';
        }
      }

      // 3. Priority: Check client active tab session (client remains on booking/appointments upon refresh in same tab)
      try {
        const clientSessionView = sessionStorage.getItem(STORAGE_KEYS.CLIENT_SESSION_VIEW);
        if (clientSessionView && (clientSessionView === 'client_booking' || clientSessionView === 'client_appointments')) {
          return clientSessionView as any;
        }
      } catch {}

      // 4. Check saved view in localStorage
      const savedView = localStorage.getItem(STORAGE_KEYS.CURRENT_VIEW) as any;
      if (savedView && ['client_booking', 'client_appointments', 'barber_dashboard', 'super_admin_dashboard', 'landing_page'].includes(savedView)) {
        if ((savedView === 'barber_dashboard' || savedView === 'super_admin_dashboard') && !isLoggedIn) {
          return 'landing_page';
        }
        return savedView;
      }
    }

    // Default entry page when first visit without any saved state
    return 'landing_page';
  });

  const [activeBarberTab, setActiveBarberTab] = useState<'schedule' | 'financial' | 'services' | 'settings'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBER_TAB);
    if (saved && ['schedule', 'financial', 'services', 'settings'].includes(saved)) {
      return saved as any;
    }
    return 'schedule';
  });
  const [isBarberDrawerOpen, setIsBarberDrawerOpen] = useState<boolean>(false);

  // Handle URL navigation and popstate/hashchange events
  useEffect(() => {
    const handleUrlNavigation = () => {
      const route = resolveRouteFromUrl(barbershops);
      const isLoggedIn = localStorage.getItem(STORAGE_KEYS.AUTH_LOGGED_IN) === 'true';

      if (route.shopId) {
        setActiveBarbershopId(route.shopId);
        try {
          sessionStorage.setItem(STORAGE_KEYS.CLIENT_SESSION_SHOP_ID, route.shopId);
        } catch {}
      }

      if (route.view) {
        if ((route.view === 'super_admin_dashboard' || route.view === 'barber_dashboard') && !isLoggedIn) {
          // Open appropriate login modal for direct unauthorized access
          if (route.view === 'super_admin_dashboard') {
            setLoginModalRole('super_admin');
            setIsLoginModalOpen(true);
          } else {
            setLoginModalRole('barber');
            setIsLoginModalOpen(true);
          }
        } else {
          setCurrentView(route.view);
          if (route.view === 'client_booking' || route.view === 'client_appointments') {
            try {
              sessionStorage.setItem(STORAGE_KEYS.CLIENT_SESSION_VIEW, route.view);
            } catch {}
          }
        }
      }
    };

    window.addEventListener('popstate', handleUrlNavigation);
    window.addEventListener('hashchange', handleUrlNavigation);
    return () => {
      window.removeEventListener('popstate', handleUrlNavigation);
      window.removeEventListener('hashchange', handleUrlNavigation);
    };
  }, [barbershops]);

  // Track last seen appointment time for accurate "new appointment" notification
  const [lastSeenAppointmentTime, setLastSeenAppointmentTime] = useState<string>(() => {
    return localStorage.getItem('barber_last_seen_appointments') || new Date().toISOString();
  });

  const markAppointmentsAsSeen = () => {
    const now = new Date().toISOString();
    setLastSeenAppointmentTime(now);
    localStorage.setItem('barber_last_seen_appointments', now);
  };

  const currentShopId = currentUser.barbershopId || activeBarbershopId;
  const newAppointmentsCount = appointments.filter((apt) => {
    if (apt.barbershopId !== currentShopId) return false;
    if (!apt.createdAt) return false;
    return new Date(apt.createdAt).getTime() > new Date(lastSeenAppointmentTime).getTime();
  }).length;

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerPlanId, setRegisterPlanId] = useState<string>('annual');

  const openRegisterModal = (planId?: string) => {
    if (planId) {
      setRegisterPlanId(planId);
    }
    setIsRegisterModalOpen(true);
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalRole, setLoginModalRole] = useState<'barber' | 'super_admin'>('barber');

  const openLoginModal = (role?: 'barber' | 'super_admin') => {
    if (role) {
      setLoginModalRole(role);
    }
    setIsLoginModalOpen(true);
  };

  // Authenticate and Login User
  const loginUser = (
    identifier: string,
    pass: string
  ): { success: boolean; message?: string; user?: User } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, '');

    // Search user by email, phone, id or barbershop name
    const foundUser = users.find((u) => {
      const matchEmail = u.email && u.email.toLowerCase() === cleanId;
      const matchPhone = cleanPhone && u.phone.replace(/\D/g, '') === cleanPhone;
      const matchId = u.id.toLowerCase() === cleanId;
      return matchEmail || matchPhone || matchId;
    });

    if (!foundUser) {
      // Fallback check against INITIAL_USERS
      const fallbackUser = INITIAL_USERS.find((u) => {
        const matchEmail = u.email && u.email.toLowerCase() === cleanId;
        const matchPhone = cleanPhone && u.phone.replace(/\D/g, '') === cleanPhone;
        return matchEmail || matchPhone;
      });

      if (!fallbackUser) {
        return {
          success: false,
          message: 'Usuário não encontrado. Verifique seu e-mail ou WhatsApp digitado.',
        };
      }

      // Check password for fallback user
      const expectedPass = fallbackUser.password || (fallbackUser.role === 'super_admin' ? 'admin123' : '123456');
      if (pass !== expectedPass) {
        return {
          success: false,
          message: 'Senha incorreta. Tente novamente.',
        };
      }

      handleSetCurrentUser(fallbackUser);
      return { success: true, user: fallbackUser };
    }

    // Validate password
    const expectedPass = foundUser.password || (foundUser.role === 'super_admin' ? 'admin123' : '123456');
    if (pass !== expectedPass) {
      return {
        success: false,
        message: 'Senha incorreta. Tente novamente.',
      };
    }

    handleSetCurrentUser(foundUser);
    return { success: true, user: foundUser };
  };

  const updateUserPassword = (
    userId: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!newPassword || newPassword.trim().length < 4) {
      return {
        success: false,
        message: 'A nova senha deve ter no mínimo 4 caracteres.',
      };
    }

    const trimmedPass = newPassword.trim();

    setUsers((prevUsers) => {
      const updated = prevUsers.map((u) => {
        if (u.id === userId) {
          const userUpdated = { ...u, password: trimmedPass };
          supabaseService.upsertUser(userUpdated);
          return userUpdated;
        }
        return u;
      });
      return updated;
    });

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, password: trimmedPass }));
    }

    return {
      success: true,
      message: 'Senha alterada com sucesso!',
    };
  };

  const updateUserProfile = (
    userId: string,
    updates: Partial<User>
  ): { success: boolean; message: string } => {
    setUsers((prevUsers) => {
      const updated = prevUsers.map((u) => {
        if (u.id === userId) {
          const userUpdated = { ...u, ...updates };
          supabaseService.upsertUser(userUpdated);
          return userUpdated;
        }
        return u;
      });
      return updated;
    });

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }

    return {
      success: true,
      message: 'Perfil atualizado com sucesso!',
    };
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(barbershops));
  }, [barbershops]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(platformSettings));
  }, [platformSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(subscriptionPlans));
  }, [subscriptionPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(landingPageContent));
  }, [landingPageContent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHOP_ID, activeBarbershopId);
  }, [activeBarbershopId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, currentView);
    try {
      if (currentView === 'client_booking' || currentView === 'client_appointments') {
        sessionStorage.setItem(STORAGE_KEYS.CLIENT_SESSION_VIEW, currentView);
        if (activeBarbershopId) {
          sessionStorage.setItem(STORAGE_KEYS.CLIENT_SESSION_SHOP_ID, activeBarbershopId);
        }
      } else if (currentView === 'landing_page') {
        sessionStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION_VIEW);
        sessionStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION_SHOP_ID);
      }
    } catch {}

    // Clean up stale landing anchors if on dashboard or client view
    if (typeof window !== 'undefined' && currentView !== 'landing_page') {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      const landingSectionHashes = [
        'planos', 'cadastro', 'apresentacao', 'sobre', 'precos',
        'home', 'landing', 'video-demo', 'diferenciais', 'galeria',
        'calculadora', 'simulador', 'depoimentos', 'faq',
      ];
      if (landingSectionHashes.includes(hash)) {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {}
      }
    }
  }, [currentView, activeBarbershopId]);

  // Synchronize browser URL bar query (?view=...) whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetQuery = '';
    const currentShop = barbershops.find((s) => s.id === activeBarbershopId) || barbershops[0];
    const shopSlug = currentShop?.slug || 'navalha-de-ouro';

    if (currentView === 'landing_page') {
      targetQuery = '?view=apresentacao';
    } else if (currentView === 'super_admin_dashboard') {
      targetQuery = '?view=admin';
    } else if (currentView === 'barber_dashboard') {
      targetQuery = '?view=barber_';
    } else if (currentView === 'client_booking') {
      targetQuery = `?view=${encodeURIComponent(shopSlug)}`;
    } else if (currentView === 'client_appointments') {
      targetQuery = `?view=${encodeURIComponent(shopSlug)}&sub=meus-agendamentos`;
    }

    const currentFullSearch = window.location.search;
    const currentHash = window.location.hash;
    const currentParams = new URLSearchParams(currentFullSearch);
    const currView = currentParams.get('view');
    const normCurrView = currView
      ? decodeURIComponent(currView).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : '';

    let isAlreadySynced = false;
    if (currentView === 'landing_page' && (normCurrView === 'apresentacao' || normCurrView === 'landing_page' || normCurrView === 'landing')) {
      isAlreadySynced = true;
    } else if (currentView === 'super_admin_dashboard' && (normCurrView === 'admin' || normCurrView === 'super_admin_dashboard')) {
      isAlreadySynced = true;
    } else if (currentView === 'barber_dashboard' && (normCurrView === 'barber_' || normCurrView === 'barber')) {
      isAlreadySynced = true;
    } else if (currentView === 'client_booking' && (currView?.toLowerCase() === shopSlug.toLowerCase())) {
      isAlreadySynced = true;
    } else if (currentView === 'client_appointments' && (currentParams.get('sub') === 'meus-agendamentos')) {
      isAlreadySynced = true;
    }

    if (!isAlreadySynced && targetQuery) {
      try {
        const hashToKeep = currentView === 'landing_page' ? currentHash : '';
        const newUrl = `${window.location.pathname}${targetQuery}${hashToKeep}`;
        window.history.replaceState(null, '', newUrl);
      } catch {}
    }
  }, [currentView, activeBarbershopId, barbershops]);

  // Canonical URL Link Generators
  const getBarbershopPublicUrl = (slugOrId?: string): string => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    let targetSlug = 'navalha-de-ouro';
    if (slugOrId) {
      const found = barbershops.find((s) => s.id === slugOrId || s.slug === slugOrId);
      targetSlug = found?.slug || slugOrId;
    } else {
      const activeShop = barbershops.find((s) => s.id === activeBarbershopId) || barbershops[0];
      targetSlug = activeShop?.slug || 'navalha-de-ouro';
    }
    return `${origin}/?view=${encodeURIComponent(targetSlug)}`;
  };

  const getAdminPublicUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?view=admin`;
  };

  const getBarberPublicUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?view=barber_`;
  };

  const getLandingPublicUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?view=apresentacao`;
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BARBER_TAB, activeBarberTab);
  }, [activeBarberTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRIAL_RECORDS, JSON.stringify(trialRecords));
  }, [trialRecords]);

  // Adjust view automatically when switching user role if necessary
  const handleSetCurrentUser = (newUser: User) => {
    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGGED_IN, 'true');

    if (newUser.role === 'super_admin') {
      setCurrentView('super_admin_dashboard');
      localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, 'super_admin_dashboard');
    } else if (newUser.role === 'barber') {
      if (newUser.barbershopId) {
        setActiveBarbershopId(newUser.barbershopId);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SHOP_ID, newUser.barbershopId);
      }
      setCurrentView('barber_dashboard');
      localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, 'barber_dashboard');
    } else {
      setCurrentView('client_booking');
      localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, 'client_booking');
      try {
        sessionStorage.setItem(STORAGE_KEYS.CLIENT_SESSION_VIEW, 'client_booking');
        if (newUser.barbershopId) {
          sessionStorage.setItem(STORAGE_KEYS.CLIENT_SESSION_SHOP_ID, newUser.barbershopId);
        }
      } catch {}
    }
  };

  const switchRole = (role: 'client' | 'barber' | 'super_admin') => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      handleSetCurrentUser(targetUser);
    } else {
      const fallback = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
      if (fallback) {
        handleSetCurrentUser(fallback);
      }
    }
  };

  const logoutUser = () => {
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGGED_IN, 'false');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.BARBER_TAB);
    localStorage.removeItem('barberhub_admin_tab_v2');
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION_VIEW);
      sessionStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION_SHOP_ID);
    } catch {}

    const defaultClientUser =
      users.find((u) => u.role === 'client') ||
      INITIAL_USERS.find((u) => u.role === 'client') ||
      INITIAL_USERS[0];
    if (defaultClientUser) {
      setCurrentUser(defaultClientUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, defaultClientUser.id);
    }

    setCurrentView('landing_page');
    localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, 'landing_page');

    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {}
    }
  };

  // Create Appointment (Customer)
  const createAppointment = (
    data: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'pixTransactionCode'> & { status?: AppointmentStatus }
  ): Appointment => {
    const newAppointment: Appointment = {
      ...data,
      id: generateId('apt'),
      status: data.status || 'pending_pix',
      pixTransactionCode: `PIX-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Persist to Supabase
    supabaseService.upsertAppointment(newAppointment);

    // If client user is anonymous or updating name/phone, keep user updated
    if (currentUser.role === 'client') {
      if (currentUser.name !== data.clientName || currentUser.phone !== data.clientPhone) {
        const updated = { ...currentUser, name: data.clientName, phone: data.clientPhone };
        setCurrentUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        supabaseService.upsertUser(updated);
      }
    }

    return newAppointment;
  };

  // Cancel Appointment
  const cancelAppointment = (id: string, reason?: string, cancelledBy: 'barber' | 'client' = 'barber') => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;
        const updated: Appointment = {
          ...apt,
          status: 'cancelled',
          cancellationReason: reason || 'Cancelado',
          cancelledBy,
          cancelledAt: formattedDate,
          notes: reason
            ? `${apt.notes ? apt.notes + ' • ' : ''}[Cancelado por ${cancelledBy === 'barber' ? 'Barbeiro' : 'Cliente'}: ${reason}]`
            : apt.notes,
        };
        supabaseService.upsertAppointment(updated);
        return updated;
      })
    );
  };

  // Confirm PIX
  const confirmAppointmentPix = (id: string, proofUrl?: string, transactionCode?: string) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;
        const updated: Appointment = {
          ...apt,
          status: 'confirmed',
          pixPaidAt: formattedDate,
          pixProofUrl: proofUrl || apt.pixProofUrl,
          pixTransactionCode: transactionCode || apt.pixTransactionCode,
        };
        supabaseService.upsertAppointment(updated);
        return updated;
      })
    );
  };

  const completeAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;
        const updated: Appointment = { ...apt, status: 'completed' };
        supabaseService.upsertAppointment(updated);
        return updated;
      })
    );
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;
        const updated: Appointment = { ...apt, status };
        supabaseService.upsertAppointment(updated);
        return updated;
      })
    );
  };

  // Services CRUD
  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: generateId('srv'),
    };
    setServices((prev) => [...prev, newService]);
    supabaseService.upsertService(newService);
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((srv) => {
        if (srv.id !== id) return srv;
        const updated: Service = { ...srv, ...updates };
        supabaseService.upsertService(updated);
        return updated;
      })
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((srv) => srv.id !== id));
    supabaseService.deleteService(id);
  };

  // Barbershop Updates
  const updateBarbershop = (id: string, updates: Partial<Barbershop>) => {
    setBarbershops((prev) =>
      prev.map((shop) => {
        if (shop.id !== id) return shop;
        const updated: Barbershop = { ...shop, ...updates };
        supabaseService.upsertBarbershop(updated);
        return updated;
      })
    );
    if (updates.logoUrl) {
      setCurrentUser((prev) => {
        const updated = prev.barbershopId === id ? { ...prev, avatarUrl: updates.logoUrl } : prev;
        if (prev.barbershopId === id) supabaseService.upsertUser(updated);
        return updated;
      });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.barbershopId !== id) return u;
          const updated = { ...u, avatarUrl: updates.logoUrl };
          supabaseService.upsertUser(updated);
          return updated;
        })
      );
    }
  };

  // Submit proof of monthly subscription payment by Barber
  const submitSubscriptionPaymentProof = (barbershopId: string, proofNote: string) => {
    const todayStr = getTodayDateString();
    setBarbershops((prev) =>
      prev.map((shop) => {
        if (shop.id !== barbershopId) return shop;
        const updated: Barbershop = {
          ...shop,
          subscriptionStatus: 'pending',
          subscriptionProofUrl: proofNote,
          subscriptionRequestedAt: todayStr,
        };
        supabaseService.upsertBarbershop(updated);
        return updated;
      })
    );
  };

  // Super Admin / Auto-Pay: Approve Barber Subscription
  const approveBarbershopSubscription = (
    barbershopId: string,
    daysValid = 30,
    upgradedPlanId?: SubscriptionPlanPeriod
  ) => {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + daysValid);
    const validUntil = validDate.toISOString().split('T')[0];
    const todayStr = getTodayDateString();

    setBarbershops((prev) =>
      prev.map((shop) => {
        if (shop.id !== barbershopId) return shop;
        const finalPlanId = upgradedPlanId || (shop.subscriptionPlanId === 'trial' ? 'monthly' : shop.subscriptionPlanId);
        const planObj = subscriptionPlans.find((p) => p.id === finalPlanId);
        const updated: Barbershop = {
          ...shop,
          subscriptionPlanId: finalPlanId,
          subscriptionMonthlyFee: planObj ? planObj.price : shop.subscriptionMonthlyFee,
          subscriptionStatus: 'active',
          subscriptionValidUntil: validUntil,
          subscriptionLastPaymentDate: todayStr,
          subscriptionProofUrl: undefined,
        };
        supabaseService.upsertBarbershop(updated);
        return updated;
      })
    );
  };

  const rejectBarbershopSubscription = (barbershopId: string) => {
    setBarbershops((prev) =>
      prev.map((shop) => {
        if (shop.id !== barbershopId) return shop;
        const updated: Barbershop = {
          ...shop,
          subscriptionStatus: 'overdue',
          subscriptionProofUrl: undefined,
        };
        supabaseService.upsertBarbershop(updated);
        return updated;
      })
    );
  };

  const updateBarbershopSubscriptionStatus = (barbershopId: string, status: SubscriptionStatus) => {
    setBarbershops((prev) =>
      prev.map((shop) => {
        if (shop.id !== barbershopId) return shop;
        const updated: Barbershop = { ...shop, subscriptionStatus: status };
        supabaseService.upsertBarbershop(updated);
        return updated;
      })
    );
  };

  const deleteBarbershop = (id: string) => {
    // 1. Remove from barbershops state
    setBarbershops((prev) => {
      const remaining = prev.filter((shop) => shop.id !== id);
      if (activeBarbershopId === id) {
        const nextId = remaining.length > 0 ? remaining[0].id : '';
        setActiveBarbershopId(nextId);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SHOP_ID, nextId);
      }
      localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(remaining));
      return remaining;
    });

    // 2. Cascade delete services of this barbershop
    setServices((prev) => {
      const remaining = prev.filter((srv) => srv.barbershopId !== id);
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(remaining));
      return remaining;
    });

    // 3. Cascade delete appointments of this barbershop
    setAppointments((prev) => {
      const remaining = prev.filter((apt) => apt.barbershopId !== id);
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(remaining));
      return remaining;
    });

    // 4. Cascade delete user accounts belonging to this barbershop
    setUsers((prev) => {
      const remaining = prev.filter((u) => u.barbershopId !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remaining));
      return remaining;
    });

    // 5. Cascade delete in Supabase & Server DB
    supabaseService.deleteBarbershop(id);
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => {
      const remaining = prev.filter((apt) => apt.id !== id);
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(remaining));
      return remaining;
    });
    supabaseService.deleteAppointment(id);
  };

  const deleteTrialRecord = (id: string) => {
    setTrialRecords((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TRIAL_RECORDS, JSON.stringify(remaining));
      return remaining;
    });
  };

  const deleteUserAccount = (id: string) => {
    setUsers((prev) => {
      const remaining = prev.filter((u) => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remaining));
      return remaining;
    });
  };

  const clearAllDemoData = () => {
    const cleanShops: Barbershop[] = [];
    const cleanServices: Service[] = [];
    const cleanAppointments: Appointment[] = [];
    const cleanTrials: TrialUserRecord[] = [];
    // Keep only super admins so admin access is never locked
    const cleanUsers = users.filter((u) => u.role === 'super_admin');

    setBarbershops(cleanShops);
    setServices(cleanServices);
    setAppointments(cleanAppointments);
    setTrialRecords(cleanTrials);
    setUsers(cleanUsers);
    setActiveBarbershopId('');

    localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(cleanShops));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(cleanServices));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(cleanAppointments));
    localStorage.setItem(STORAGE_KEYS.TRIAL_RECORDS, JSON.stringify(cleanTrials));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanUsers));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHOP_ID, '');

    fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershops: cleanShops,
        services: cleanServices,
        appointments: cleanAppointments,
        trialRecords: cleanTrials,
        users: cleanUsers,
      }),
    }).catch((err) => console.warn('Clear demo sync error:', err));
  };

  const updatePlatformSettings = (settings: Partial<PlatformSettings>) => {
    const logo = settings.platformLogoUrl || settings.logoUrl;
    const normalizedSettings = {
      ...settings,
      ...(logo ? { platformLogoUrl: logo, logoUrl: logo } : {}),
    };
    setPlatformSettings((prev) => {
      const updated = { ...prev, ...normalizedSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      supabaseService.upsertPlatformSettings(updated);
      return updated;
    });
    if (logo) {
      setLandingPageContent((prev) => {
        const updated = { ...prev, brandLogoUrl: logo };
        localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(updated));
        supabaseService.upsertLandingPageContent(updated);
        return updated;
      });
    }
  };

  const fetchPlatformSettings = async (): Promise<PlatformSettings | null> => {
    try {
      if (isSupabaseConfigured()) {
        const remote = await supabaseService.getPlatformSettings();
        if (remote) {
          setPlatformSettings((prev) => {
            const merged = { ...prev, ...remote };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
            return merged;
          });
          return remote;
        }
      }
      const res = await fetch('/api/db');
      if (res.ok) {
        const json = await res.json();
        if (json.settings) {
          setPlatformSettings((prev) => {
            const merged = { ...prev, ...json.settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
            return merged;
          });
          return json.settings;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar configurações da plataforma:', err);
    }
    return null;
  };

  const updateSubscriptionPlan = (id: SubscriptionPlanPeriod, updates: Partial<SubscriptionPlan>) => {
    setSubscriptionPlans((prev) => {
      const updated = prev.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updated));
      const target = updated.find((p) => p.id === id);
      if (target) supabaseService.upsertSubscriptionPlan(target);
      return updated;
    });
  };

  const updateLandingPageContent = (updates: Partial<LandingPageContent>) => {
    // Normalize video URL if updated to prevent X-Frame-Options embedding errors
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.videoUrl !== undefined) {
      const parsed = parseVideoUrl(sanitizedUpdates.videoUrl);
      if (parsed.isValid && parsed.embedUrl) {
        sanitizedUpdates.videoUrl = parsed.embedUrl;
      }
    }

    setLandingPageContent((prev) => {
      const updated = { ...prev, ...sanitizedUpdates };
      try {
        localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(updated));
      } catch {}
      saveToServerDb('landing', updated, 'upsert');
      supabaseService.upsertLandingPageContent(updated);
      return updated;
    });

    if (sanitizedUpdates.brandLogoUrl) {
      setPlatformSettings((prev) => {
        const updated = { ...prev, platformLogoUrl: sanitizedUpdates.brandLogoUrl };
        try {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        } catch {}
        saveToServerDb('platform_settings', updated, 'upsert');
        supabaseService.upsertPlatformSettings(updated);
        return updated;
      });
    }
  };

  // Helper to verify if user has already consumed free trial
  const checkTrialEligibility = (
    name: string,
    phone: string,
    email?: string
  ): { isEligible: boolean; reason?: string; matchedField?: 'email' | 'phone' | 'name' } => {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 1. Check in trial records
    for (const rec of trialRecords) {
      const recPhone = (rec.phone || '').replace(/\D/g, '');
      const recEmail = (rec.email || '').trim().toLowerCase();
      const recName = (rec.name || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (cleanPhone.length >= 8 && recPhone === cleanPhone) {
        return {
          isEligible: false,
          matchedField: 'phone',
          reason: `O telefone informado (${formatPhone(phone)}) já foi utilizado para ativar o teste grátis anteriormente.`,
        };
      }
      if (cleanEmail && recEmail && recEmail === cleanEmail) {
        return {
          isEligible: false,
          matchedField: 'email',
          reason: `O e-mail "${email}" já foi cadastrado no período de teste grátis.`,
        };
      }
      if (cleanName.length >= 3 && recName === cleanName) {
        return {
          isEligible: false,
          matchedField: 'name',
          reason: `O usuário com o nome "${name}" já usufruiu do período de teste grátis.`,
        };
      }
    }

    // 2. Check in existing barbershops
    for (const shop of barbershops) {
      const shopPhone = (shop.phone || shop.ownerPhone || '').replace(/\D/g, '');
      const shopOwner = (shop.ownerName || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (shop.subscriptionPlanId === 'trial') {
        if (cleanPhone.length >= 8 && shopPhone === cleanPhone) {
          return {
            isEligible: false,
            matchedField: 'phone',
            reason: `O telefone ${formatPhone(phone)} já possui uma barbearia com teste grátis cadastrada (${shop.name}).`,
          };
        }
        if (cleanName.length >= 3 && shopOwner === cleanName) {
          return {
            isEligible: false,
            matchedField: 'name',
            reason: `O barbeiro "${name}" já possui registro com teste grátis na barbearia "${shop.name}".`,
          };
        }
      }
    }

    // 3. Check in users
    for (const user of users) {
      if (user.role === 'barber') {
        const userEmail = (user.email || '').trim().toLowerCase();
        const shop = user.barbershopId ? barbershops.find((s) => s.id === user.barbershopId) : null;
        if (shop && shop.subscriptionPlanId === 'trial') {
          if (cleanEmail && userEmail && userEmail === cleanEmail) {
            return {
              isEligible: false,
              matchedField: 'email',
              reason: `O e-mail "${email}" já pertence a uma conta de barbeiro que usufruiu do teste grátis.`,
            };
          }
        }
      }
    }

    return { isEligible: true };
  };

  // Helper to check if a shop's subscription is overdue or expired
  const isSubscriptionExpired = (shop: Barbershop): boolean => {
    if (!shop) return false;
    if (shop.subscriptionStatus === 'overdue' || shop.subscriptionStatus === 'suspended') return true;
    if (!shop.subscriptionValidUntil) return false;
    const todayStr = getTodayDateString();
    return shop.subscriptionValidUntil < todayStr;
  };

  // Helper to calculate days left
  const getRemainingDays = (validUntil: string): number => {
    if (!validUntil) return 0;
    const [y, m, d] = validUntil.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Register New Barbershop
  const registerNewBarbershop = (data: {
    barberName: string;
    phone: string;
    email?: string;
    password?: string;
    shopName: string;
    address: string;
    city: string;
    pixKey: string;
    pixKeyType: any;
    themeColor?: string;
    bio?: string;
    planId?: SubscriptionPlanPeriod;
  }): Barbershop => {
    const newUserId = generateId('usr_barber');
    const newShopId = generateId('shop');
    const slug = data.shopName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const selectedPlan = subscriptionPlans.find((p) => p.id === data.planId) || subscriptionPlans[0];
    const isTrial = selectedPlan.id === 'trial';

    // Calculate trial expiration date (exactly 30 days)
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + (isTrial ? 30 : 30));
    const validUntilDateStr = validDate.toISOString().split('T')[0];

    const newUser: User = {
      id: newUserId,
      name: data.barberName,
      phone: data.phone,
      email: data.email || `${slug}@barberhub.com.br`,
      password: data.password || '123456',
      role: 'barber',
      barbershopId: newShopId,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };

    const newShop: Barbershop = {
      id: newShopId,
      ownerId: newUserId,
      ownerName: data.barberName,
      ownerPhone: data.phone,
      name: data.shopName,
      slug: slug || `barbearia-${Math.floor(1000 + Math.random() * 9000)}`,
      logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80',
      phone: data.phone,
      address: data.address,
      city: data.city || 'São Paulo',
      instagram: `@${slug}`,
      bio: data.bio || 'Atendimento de alta qualidade com agendamento online descomplicado.',
      themeColor: data.themeColor || '#d97706',
      pixKey: data.pixKey,
      pixKeyType: data.pixKeyType || 'phone',
      pixReceiverName: data.barberName.toUpperCase(),
      acceptedPaymentMethods: ['pix_manual', 'cash', 'card'],
      subscriptionPlanId: selectedPlan.id,
      // Trial is automatically activated for 30 days! Paid plans start in pending status until PIX is confirmed
      subscriptionStatus: isTrial ? 'active' : 'pending',
      subscriptionMonthlyFee: selectedPlan.price,
      subscriptionValidUntil: isTrial ? validUntilDateStr : getTodayDateString(),
      subscriptionRequestedAt: getTodayDateString(),
      subscriptionLastPaymentDate: isTrial ? getTodayDateString() : undefined,
      subscriptionProofUrl: isTrial
        ? 'Ativação Automática - Teste Grátis (30 Dias)'
        : `Comprovante PIX Adesão ${selectedPlan.name} (R$ ${selectedPlan.price.toFixed(2)})`,
      slotIntervalMinutes: 30,
      bookingWindowDays: 15,
      confirmationMode: 'pix',
      workingHours: {
        0: { isOpen: false, openTime: '09:00', closeTime: '14:00' },
        1: { isOpen: true, openTime: '09:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
        2: { isOpen: true, openTime: '09:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
        3: { isOpen: true, openTime: '09:00', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
        4: { isOpen: true, openTime: '09:00', closeTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
        5: { isOpen: true, openTime: '09:00', closeTime: '20:00', breakStart: '12:00', breakEnd: '13:00' },
        6: { isOpen: true, openTime: '08:30', closeTime: '19:00', breakStart: '12:00', breakEnd: '13:00' },
      },
    };

    // If trial plan, record usage to prevent duplicate registration
    let updatedTrials = trialRecords;
    if (isTrial) {
      const newTrialRecord: TrialUserRecord = {
        id: generateId('trial_rec'),
        name: data.barberName,
        phone: data.phone,
        email: data.email,
        barbershopId: newShopId,
        barbershopName: data.shopName,
        registeredAt: getTodayDateString(),
      };
      updatedTrials = [...trialRecords, newTrialRecord];
      setTrialRecords(updatedTrials);
      localStorage.setItem(STORAGE_KEYS.TRIAL_RECORDS, JSON.stringify(updatedTrials));
      saveToServerDb('trialRecords', newTrialRecord, 'upsert');
      supabaseService.upsertTrialRecord(newTrialRecord);
    }

    // Default starter services for this shop
    const defaultServices: Service[] = [
      {
        id: generateId('srv'),
        barbershopId: newShopId,
        name: 'Corte Degradê / Social',
        description: 'Corte completo com lavagem e finalização.',
        price: 35.0,
        durationMinutes: 30,
        category: 'cabelo',
        active: true,
      },
      {
        id: generateId('srv'),
        barbershopId: newShopId,
        name: 'Barba Alinhada',
        description: 'Desenho e hidratação da barba.',
        price: 30.0,
        durationMinutes: 30,
        category: 'barba',
        active: true,
      },
      {
        id: generateId('srv'),
        barbershopId: newShopId,
        name: 'Combo Corte + Barba',
        description: 'Corte e barba com toalha quente e pós-barba.',
        price: 55.0,
        durationMinutes: 50,
        category: 'combo',
        active: true,
      },
    ];

    const updatedUsers = [...users.filter((u) => u.id !== newUser.id), newUser];
    const updatedShops = [...barbershops.filter((s) => s.id !== newShop.id), newShop];
    const updatedServices = [...services, ...defaultServices];

    setUsers(updatedUsers);
    setBarbershops(updatedShops);
    setServices(updatedServices);
    setActiveBarbershopId(newShopId);
    setCurrentUser(newUser);

    // Synchronously write to localStorage immediately so any refresh has full state
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEYS.BARBERSHOPS, JSON.stringify(updatedShops));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updatedServices));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHOP_ID, newShopId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGGED_IN, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, 'barber_dashboard');

    // Sync to Server DB immediately
    saveToServerDb('users', newUser, 'upsert');
    saveToServerDb('barbershops', newShop, 'upsert');
    defaultServices.forEach((srv) => saveToServerDb('services', srv, 'upsert'));
    syncAllToServerDb({
      barbershops: updatedShops,
      services: updatedServices,
      users: updatedUsers,
      trialRecords: updatedTrials,
    });

    // Sync new shop and services to Supabase
    supabaseService.upsertUser(newUser);
    supabaseService.upsertBarbershop(newShop);
    defaultServices.forEach((srv) => supabaseService.upsertService(srv));

    return newShop;
  };

  const getBarbershopById = (id: string) => {
    return barbershops.find((shop) => shop.id === id);
  };

  const getServicesForBarbershop = (barbershopId: string) => {
    return services.filter((srv) => srv.barbershopId === barbershopId);
  };

  const getAppointmentsForBarbershop = (barbershopId: string) => {
    return appointments.filter((apt) => apt.barbershopId === barbershopId);
  };

  const getAppointmentsForClient = (clientPhone: string) => {
    const cleaned = clientPhone.replace(/\D/g, '');
    return appointments.filter(
      (apt) => apt.clientPhone.replace(/\D/g, '') === cleaned
    );
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setBarbershops(INITIAL_BARBERSHOPS);
    setServices(INITIAL_SERVICES);
    setAppointments(INITIAL_APPOINTMENTS);
    setPlatformSettings(INITIAL_PLATFORM_SETTINGS);
    setSubscriptionPlans(INITIAL_SUBSCRIPTION_PLANS);
    setLandingPageContent(INITIAL_LANDING_CONTENT);
    setTrialRecords(INITIAL_TRIAL_RECORDS);
    setCurrentUser(INITIAL_USERS[0]);
    setActiveBarbershopId('');
    setCurrentView('landing_page');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        users,
        barbershops,
        services,
        appointments,
        platformSettings,
        subscriptionPlans,
        landingPageContent,
        trialRecords,
        activeBarbershopId,
        setActiveBarbershopId,
        currentView,
        setCurrentView,
        activeBarberTab,
        setActiveBarberTab,
        isBarberDrawerOpen,
        setIsBarberDrawerOpen,
        newAppointmentsCount,
        markAppointmentsAsSeen,
        switchRole,
        isSupabaseActive,
        supabaseStatus,
        checkSupabaseConnection,
        syncAllToSupabase,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        registerPlanId,
        setRegisterPlanId,
        openRegisterModal,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginModalRole,
        setLoginModalRole,
        openLoginModal,
        loginUser,
        updateUserPassword,
        updateUserProfile,
        logoutUser,
        createAppointment,
        cancelAppointment,
        confirmAppointmentPix,
        completeAppointment,
        updateAppointmentStatus,
        addService,
        updateService,
        deleteService,
        updateBarbershop,
        submitSubscriptionPaymentProof,
        approveBarbershopSubscription,
        rejectBarbershopSubscription,
        updateBarbershopSubscriptionStatus,
        deleteBarbershop,
        deleteAppointment,
        deleteTrialRecord,
        deleteUserAccount,
        clearAllDemoData,
        updatePlatformSettings,
        fetchPlatformSettings,
        updateSubscriptionPlan,
        updateLandingPageContent,
        registerNewBarbershop,
        checkTrialEligibility,
        isSubscriptionExpired,
        getRemainingDays,
        getBarbershopById,
        getServicesForBarbershop,
        getAppointmentsForBarbershop,
        getAppointmentsForClient,
        resetToDefaultData,
        getBarbershopPublicUrl,
        getAdminPublicUrl,
        getBarberPublicUrl,
        getLandingPublicUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

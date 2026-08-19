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
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_BARBERSHOPS,
  INITIAL_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_PLATFORM_SETTINGS,
  INITIAL_SUBSCRIPTION_PLANS,
  INITIAL_LANDING_CONTENT,
} from '../data/initialData';
import { generateId, getTodayDateString } from '../utils/formatters';

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
  activeBarbershopId: string;
  setActiveBarbershopId: (id: string) => void;
  currentView: 'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page';
  setCurrentView: (view: 'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page') => void;
  switchRole: (role: 'client' | 'barber' | 'super_admin') => void;
  
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
  logoutUser: () => void;
  
  // Client & Barber Actions
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'pixTransactionCode'> & { status?: AppointmentStatus }) => Appointment;
  cancelAppointment: (id: string, reason?: string, cancelledBy?: 'barber' | 'client') => void;
  
  // Barber Actions
  confirmAppointmentPix: (id: string) => void;
  completeAppointment: (id: string) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  updateBarbershop: (id: string, updates: Partial<Barbershop>) => void;
  submitSubscriptionPaymentProof: (barbershopId: string, proofNote: string) => void;
  
  // Super Admin Actions
  approveBarbershopSubscription: (barbershopId: string, daysValid?: number) => void;
  rejectBarbershopSubscription: (barbershopId: string) => void;
  updateBarbershopSubscriptionStatus: (barbershopId: string, status: SubscriptionStatus) => void;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
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

  // Helpers
  getBarbershopById: (id: string) => Barbershop | undefined;
  getServicesForBarbershop: (barbershopId: string) => Service[];
  getAppointmentsForBarbershop: (barbershopId: string) => Appointment[];
  getAppointmentsForClient: (clientPhone: string) => Appointment[];
  resetToDefaultData: () => void;
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
  CURRENT_USER_ID: 'barberhub_current_user_id_v2',
  ACTIVE_SHOP_ID: 'barberhub_active_shop_id_v2',
  CURRENT_VIEW: 'barberhub_view_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedId) {
      const found = INITIAL_USERS.find((u) => u.id === savedId);
      if (found) return found;
    }
    return INITIAL_USERS[4]; // Default to client Lucas Mendes
  });

  const [barbershops, setBarbershops] = useState<Barbershop[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBERSHOPS);
    return saved ? JSON.parse(saved) : INITIAL_BARBERSHOPS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_PLATFORM_SETTINGS;
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION_PLANS;
  });

  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANDING);
    return saved ? JSON.parse(saved) : INITIAL_LANDING_CONTENT;
  });

  const [activeBarbershopId, setActiveBarbershopId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHOP_ID);
    return saved || 'shop_navalha';
  });

  const [currentView, setCurrentView] = useState<'client_booking' | 'client_appointments' | 'barber_dashboard' | 'super_admin_dashboard' | 'landing_page'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_VIEW);
    return (saved as any) || 'client_booking';
  });

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
          return { ...u, password: trimmedPass };
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
  }, [currentView]);

  // Adjust view automatically when switching user role if necessary
  const handleSetCurrentUser = (newUser: User) => {
    setCurrentUser(newUser);
    if (newUser.role === 'super_admin') {
      setCurrentView('super_admin_dashboard');
    } else if (newUser.role === 'barber') {
      if (newUser.barbershopId) {
        setActiveBarbershopId(newUser.barbershopId);
      }
      setCurrentView('barber_dashboard');
    } else {
      setCurrentView('client_booking');
    }
  };

  const switchRole = (role: 'client' | 'barber' | 'super_admin') => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      handleSetCurrentUser(targetUser);
    } else {
      const fallback = INITIAL_USERS.find((u) => u.role === role);
      if (fallback) {
        handleSetCurrentUser(fallback);
      }
    }
  };

  const logoutUser = () => {
    const defaultClient = users.find((u) => u.role === 'client') || INITIAL_USERS[4];
    setCurrentUser(defaultClient);
    setCurrentView('landing_page');
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

    // If client user is anonymous or updating name/phone, keep user updated
    if (currentUser.role === 'client') {
      if (currentUser.name !== data.clientName || currentUser.phone !== data.clientPhone) {
        const updated = { ...currentUser, name: data.clientName, phone: data.clientPhone };
        setCurrentUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      }
    }

    return newAppointment;
  };

  // Cancel Appointment
  const cancelAppointment = (id: string, reason?: string, cancelledBy: 'barber' | 'client' = 'barber') => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: 'cancelled',
              cancellationReason: reason || 'Cancelado',
              cancelledBy,
              cancelledAt: formattedDate,
              notes: reason
                ? `${apt.notes ? apt.notes + ' • ' : ''}[Cancelado por ${cancelledBy === 'barber' ? 'Barbeiro' : 'Cliente'}: ${reason}]`
                : apt.notes,
            }
          : apt
      )
    );
  };

  // Confirm PIX
  const confirmAppointmentPix = (id: string) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: 'confirmed',
              pixPaidAt: formattedDate,
            }
          : apt
      )
    );
  };

  const completeAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: 'completed' } : apt))
    );
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
  };

  // Services CRUD
  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: generateId('srv'),
    };
    setServices((prev) => [...prev, newService]);
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, ...updates } : srv))
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((srv) => srv.id !== id));
  };

  // Barbershop Updates
  const updateBarbershop = (id: string, updates: Partial<Barbershop>) => {
    setBarbershops((prev) =>
      prev.map((shop) => (shop.id === id ? { ...shop, ...updates } : shop))
    );
  };

  // Submit proof of monthly subscription payment by Barber
  const submitSubscriptionPaymentProof = (barbershopId: string, proofNote: string) => {
    const todayStr = getTodayDateString();
    setBarbershops((prev) =>
      prev.map((shop) =>
        shop.id === barbershopId
          ? {
              ...shop,
              subscriptionStatus: 'pending',
              subscriptionProofUrl: proofNote,
              subscriptionRequestedAt: todayStr,
            }
          : shop
      )
    );
  };

  // Super Admin: Approve Barber Subscription
  const approveBarbershopSubscription = (barbershopId: string, daysValid = 30) => {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + daysValid);
    const validUntil = validDate.toISOString().split('T')[0];
    const todayStr = getTodayDateString();

    setBarbershops((prev) =>
      prev.map((shop) =>
        shop.id === barbershopId
          ? {
              ...shop,
              subscriptionStatus: 'active',
              subscriptionValidUntil: validUntil,
              subscriptionLastPaymentDate: todayStr,
              subscriptionProofUrl: undefined,
            }
          : shop
      )
    );
  };

  const rejectBarbershopSubscription = (barbershopId: string) => {
    setBarbershops((prev) =>
      prev.map((shop) =>
        shop.id === barbershopId
          ? {
              ...shop,
              subscriptionStatus: 'overdue',
              subscriptionProofUrl: undefined,
            }
          : shop
      )
    );
  };

  const updateBarbershopSubscriptionStatus = (barbershopId: string, status: SubscriptionStatus) => {
    setBarbershops((prev) =>
      prev.map((shop) => (shop.id === barbershopId ? { ...shop, subscriptionStatus: status } : shop))
    );
  };

  const updatePlatformSettings = (settings: Partial<PlatformSettings>) => {
    setPlatformSettings((prev) => ({ ...prev, ...settings }));
  };

  const updateSubscriptionPlan = (id: SubscriptionPlanPeriod, updates: Partial<SubscriptionPlan>) => {
    setSubscriptionPlans((prev) =>
      prev.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan))
    );
  };

  const updateLandingPageContent = (updates: Partial<LandingPageContent>) => {
    setLandingPageContent((prev) => ({ ...prev, ...updates }));
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
      subscriptionPlanId: selectedPlan.id,
      subscriptionStatus: 'pending', // Requires Super Admin approval!
      subscriptionMonthlyFee: selectedPlan.price,
      subscriptionValidUntil: getTodayDateString(),
      subscriptionRequestedAt: getTodayDateString(),
      subscriptionProofUrl: `Comprovante PIX Adesão ${selectedPlan.name} (R$ ${selectedPlan.price.toFixed(2)})`,
      slotIntervalMinutes: 30,
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

    setUsers((prev) => [...prev, newUser]);
    setBarbershops((prev) => [...prev, newShop]);
    setServices((prev) => [...prev, ...defaultServices]);

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
    setCurrentUser(INITIAL_USERS[4]);
    setActiveBarbershopId('shop_navalha');
    setCurrentView('client_booking');
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
        activeBarbershopId,
        setActiveBarbershopId,
        currentView,
        setCurrentView,
        switchRole,
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
        updatePlatformSettings,
        updateSubscriptionPlan,
        updateLandingPageContent,
        registerNewBarbershop,
        getBarbershopById,
        getServicesForBarbershop,
        getAppointmentsForBarbershop,
        getAppointmentsForClient,
        resetToDefaultData,
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

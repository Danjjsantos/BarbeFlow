export type UserRole = 'super_admin' | 'barber' | 'client';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export type SubscriptionStatus = 'pending' | 'active' | 'overdue' | 'suspended';

export type SubscriptionPlanPeriod = 'trial' | 'monthly' | 'semiannual' | 'annual';

export type AppointmentStatus = 'pending_pix' | 'confirmed' | 'completed' | 'cancelled';

export type ServiceCategory = 'cabelo' | 'barba' | 'combo' | 'sobrancelha' | 'quimica' | 'outros';

export interface TrialUserRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  barbershopId?: string;
  barbershopName?: string;
  registeredAt: string;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanPeriod;
  name: string;
  periodMonths: number;
  price: number;
  originalPrice?: number;
  monthlyEquivalent: number;
  discountPercent?: number;
  description: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
  active: boolean;
}

export interface LandingFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface LandingGalleryImage {
  id: string;
  title: string;
  url: string;
  caption: string;
}

export interface LandingStat {
  value: string;
  label: string;
  subtext?: string;
}

export interface LandingTestimonial {
  id: string;
  name: string;
  shopName: string;
  city: string;
  avatarUrl: string;
  comment: string;
  rating: number;
  revenueGrowth?: string;
}

export interface LandingFaq {
  id: string;
  question: string;
  answer: string;
}

export interface LandingPageContent {
  brandLogoUrl?: string;
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  videoPosterUrl: string;
  features: LandingFeature[];
  galleryImages: LandingGalleryImage[];
  stats: LandingStat[];
  testimonials: LandingTestimonial[];
  faqs: LandingFaq[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: UserRole;
  barbershopId?: string; // If barber, links to their shop
  avatarUrl?: string;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;  // e.g. "09:00"
  closeTime: string; // e.g. "20:00"
  breakStart?: string; // e.g. "12:00"
  breakEnd?: string;   // e.g. "13:00"
}

export interface BarbershopWorkingHours {
  [dayOfWeek: number]: DaySchedule; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface Barbershop {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl: string;
  phone: string;
  address: string;
  city: string;
  instagram?: string;
  bio: string;
  themeColor: string; // Hex color code e.g. "#d97706" (amber-600) or "#0ea5e9"
  pixKey: string;
  pixKeyType: PixKeyType;
  pixReceiverName: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoEnabled?: boolean;
  subscriptionPlanId?: SubscriptionPlanPeriod;
  subscriptionStatus: SubscriptionStatus;
  subscriptionMonthlyFee: number; // in R$
  subscriptionValidUntil: string; // YYYY-MM-DD
  subscriptionProofUrl?: string;
  subscriptionRequestedAt: string;
  subscriptionLastPaymentDate?: string;
  workingHours: BarbershopWorkingHours;
  slotIntervalMinutes: number; // 30 or 45 or 60 min
  bookingWindowDays?: number; // e.g. 8, 15, 30 (1 month), 60 (2 months)
  confirmationMode?: 'pix' | 'whatsapp'; // 'pix' = auto/prepaid via PIX; 'whatsapp' = direct booking & WhatsApp notification
}

export interface Service {
  id: string;
  barbershopId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: ServiceCategory;
  active: boolean;
  iconName?: string;
}

export interface Appointment {
  id: string;
  barbershopId: string;
  barberName: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  pixKeyUsed: string;
  pixTransactionCode: string;
  pixPaidAt?: string;
  mercadoPagoPaymentId?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: 'barber' | 'client';
  cancelledAt?: string;
  paymentMethod: 'pix' | 'presencial';
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  platformLogoUrl?: string;
  platformPixKey: string;
  platformPixKeyType: PixKeyType;
  platformPixReceiverName: string;
  monthlyFee: number; // R$ per barber/month
  supportPhone: string;
  supportEmail: string;
  pixInstructions: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoEnabled?: boolean;
}

export interface MercadoPagoPixResponse {
  success: boolean;
  paymentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  error?: string;
  isRealMercadoPago?: boolean;
  payment?: {
    id: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process';
  };
}

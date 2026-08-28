import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, Barbershop, Appointment, PaymentMethodType } from '../../types';
import {
  formatCurrency,
  formatPhone,
  cleanPhone,
  formatDateBr,
  formatDateExtenso,
  getDayOfWeekName,
  getTodayDateString,
  openWhatsApp,
} from '../../utils/formatters';
import { PixPaymentModal } from './PixPaymentModal';
import { NotificationBanner } from '../common/NotificationBanner';
import {
  notifyClientBookingConfirmed,
  notifyBarberNewBooking,
} from '../../utils/notifications';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Instagram,
  Flame,
  Star,
  Layers,
  ArrowRight,
  Info,
  Eye,
  ArrowLeft,
  KeyRound,
  MessageSquare,
  CreditCard,
  Banknote,
  QrCode,
  Zap,
  Check,
} from 'lucide-react';

export const ClientBookingFlow: React.FC = () => {
  const {
    currentUser,
    barbershops,
    activeBarbershopId,
    setActiveBarbershopId,
    getBarbershopById,
    getServicesForBarbershop,
    getAppointmentsForBarbershop,
    createAppointment,
    confirmAppointmentPix,
    setCurrentView,
    openLoginModal,
  } = useApp();

  const currentShop: Barbershop | undefined =
    getBarbershopById(activeBarbershopId) || barbershops[0];

  const services = getServicesForBarbershop(currentShop?.id || '');
  const shopAppointments = getAppointmentsForBarbershop(currentShop?.id || '');

  // Form State
  const [clientName, setClientName] = useState(
    currentUser.role === 'client' ? currentUser.name : ''
  );
  const [clientPhone, setClientPhone] = useState(
    currentUser.role === 'client' ? currentUser.phone : ''
  );
  const [selectedService, setSelectedService] = useState<Service | null>(
    services[0] || null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Payment Selection State
  const isShopEligibleForAutoPix =
    currentShop?.subscriptionPlanId === 'semiannual' ||
    currentShop?.subscriptionPlanId === 'annual';

  const allowedPaymentMethods: PaymentMethodType[] = useMemo(() => {
    if (!currentShop) return ['pix_manual', 'cash', 'card'];
    const configured = currentShop.acceptedPaymentMethods || [];
    if (configured.length > 0) {
      return configured.filter((m) => {
        if (m === 'pix_automatic' && !isShopEligibleForAutoPix) return false;
        return true;
      });
    }
    if (currentShop.confirmationMode === 'whatsapp') {
      return ['cash', 'card'];
    }
    return ['pix_manual', 'cash', 'card'];
  }, [currentShop, isShopEligibleForAutoPix]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(
    allowedPaymentMethods[0] || 'pix_manual'
  );

  useEffect(() => {
    if (allowedPaymentMethods.length > 0 && !allowedPaymentMethods.includes(selectedPaymentMethod)) {
      setSelectedPaymentMethod(allowedPaymentMethods[0]);
    }
  }, [allowedPaymentMethods, selectedPaymentMethod]);

  // PIX Modal & Direct Success Modal State
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Generate days list according to barber's configured booking window
  const bookingWindowDays = currentShop?.bookingWindowDays || 15;
  const nextDays = useMemo(() => {
    if (!currentShop) return [];
    const list: { dateStr: string; dayNum: number; dayName: string; monthName: string; isClosed: boolean }[] = [];
    const today = new Date();

    for (let i = 0; i < bookingWindowDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayOfWeek = d.getDay(); // 0 is Sunday
      const schedule = currentShop?.workingHours?.[dayOfWeek];
      const isClosed = !schedule || !schedule.isOpen;

      const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayName,
        monthName,
        isClosed,
      });
    }
    return list;
  }, [currentShop, bookingWindowDays]);

  // Calculate available time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!currentShop || !selectedDate) return [];

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    const schedule = currentShop.workingHours?.[dayOfWeek];

    if (!schedule || !schedule.isOpen || !schedule.openTime || !schedule.closeTime) {
      return [];
    }

    const slots: { time: string; isBooked: boolean }[] = [];
    const interval = currentShop.slotIntervalMinutes || 30;

    const openParts = (schedule.openTime || '08:00').split(':');
    const closeParts = (schedule.closeTime || '19:00').split(':');
    const openH = Number(openParts[0]) || 8;
    const openM = Number(openParts[1]) || 0;
    const closeH = Number(closeParts[0]) || 19;
    const closeM = Number(closeParts[1]) || 0;

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    let breakStartMinutes = -1;
    let breakEndMinutes = -1;
    if (
      schedule.breakStart &&
      schedule.breakEnd &&
      schedule.breakStart.includes(':') &&
      schedule.breakEnd.includes(':')
    ) {
      const bsp = schedule.breakStart.split(':');
      const bep = schedule.breakEnd.split(':');
      const bsh = Number(bsp[0]) || 0;
      const bsm = Number(bsp[1]) || 0;
      const beh = Number(bep[0]) || 0;
      const bem = Number(bep[1]) || 0;
      breakStartMinutes = bsh * 60 + bsm;
      breakEndMinutes = beh * 60 + bem;
    }

    // Existing appointments on this date
    const bookedTimes = new Set(
      shopAppointments
        .filter((apt) => apt.date === selectedDate && apt.status !== 'cancelled')
        .map((apt) => apt.time)
    );

    // If selected date is today, block times that have already passed
    const isToday = selectedDate === getTodayDateString();
    const currentHour = new Date().getHours();
    const currentMin = new Date().getMinutes();
    const nowMinutes = currentHour * 60 + currentMin;

    for (let m = startMinutes; m < endMinutes; m += interval) {
      if (breakStartMinutes !== -1 && m >= breakStartMinutes && m < breakEndMinutes) {
        continue;
      }

      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      const isPast = isToday && m <= nowMinutes;
      const isBooked = bookedTimes.has(timeStr) || isPast;

      slots.push({
        time: timeStr,
        isBooked,
      });
    }

    return slots;
  }, [currentShop, selectedDate, shopAppointments]);

  // Categories list
  const categories = useMemo(() => {
    const cats = ['todos'];
    services.forEach((s) => {
      if (!cats.includes(s.category)) cats.push(s.category);
    });
    return cats;
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'todos') return services.filter((s) => s.active);
    return services.filter((s) => s.active && s.category === selectedCategory);
  }, [services, selectedCategory]);

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor, informe seu Nome e Telefone WhatsApp.');
      return;
    }
    if (!selectedService) {
      alert('Por favor, selecione um serviço.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert('Por favor, selecione uma data e um horário disponível.');
      return;
    }

    if (!currentShop) {
      alert('Nenhuma barbearia ativa selecionada.');
      return;
    }

    // Save client phone for future proximity reminders
    try {
      localStorage.setItem('barberclock_last_client_phone', clientPhone.trim());
    } catch {}

    const isPresencialMethod = selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'card';

    if (isPresencialMethod) {
      // Direct booking with pending payment status
      const paymentLabel = selectedPaymentMethod === 'cash' ? 'Dinheiro (Pagar no Local)' : 'Cartão (Pagar no Local)';
      const fullNotes = notes.trim()
        ? `${notes.trim()} | Pagamento: ${paymentLabel}`
        : `Pagamento: ${paymentLabel}`;

      const newApt = createAppointment({
        barbershopId: currentShop.id,
        barberName: currentShop.ownerName,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        durationMinutes: selectedService.durationMinutes,
        date: selectedDate,
        time: selectedTime,
        pixKeyUsed: currentShop.pixKey,
        notes: fullNotes,
        paymentMethod: 'presencial',
        status: 'confirmed',
      });

      setCreatedAppointment(newApt);
      setIsSuccessModalOpen(true);

      // Trigger Push Notifications
      notifyClientBookingConfirmed(newApt, currentShop.name);
      notifyBarberNewBooking(newApt, currentShop.name);

      // Trigger pre-formatted WhatsApp message
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dayOfWeekIdx = new Date(y, m - 1, d).getDay();
      const dayName = getDayOfWeekName(dayOfWeekIdx);
      const text = `Olá *${currentShop.name}*! 👋\n\nAcabei de realizar um agendamento:\n\n✂️ *Serviço:* ${selectedService.name}\n📅 *Data:* ${formatDateBr(selectedDate)} (${dayName})\n⏰ *Horário:* ${selectedTime}\n👤 *Cliente:* ${clientName.trim()}\n📱 *WhatsApp:* ${formatPhone(clientPhone.trim())}\n💰 *Valor:* ${formatCurrency(selectedService.price)} (*Pagamento Pendente no Local via ${selectedPaymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}*)\n${notes.trim() ? `📝 *Observações:* ${notes.trim()}\n` : ''}\nFavor confirmar o recebimento. Obrigado!`;

      openWhatsApp(currentShop.phone, text);
      return;
    }

    // PIX Mode (Manual or Automatic):
    const newApt = createAppointment({
      barbershopId: currentShop.id,
      barberName: currentShop.ownerName,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      durationMinutes: selectedService.durationMinutes,
      date: selectedDate,
      time: selectedTime,
      pixKeyUsed: currentShop.pixKey,
      notes: notes.trim(),
      paymentMethod: 'pix',
      status: 'pending_pix',
    });

    setCreatedAppointment(newApt);
    setIsPixModalOpen(true);
  };

  if (!currentShop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6" id="client-booking-empty">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
          <Scissors className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Nenhuma Barbearia Selecionada</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Nenhuma barbearia ativa está disponível ou selecionada no momento.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setCurrentView('landing_page')}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const isShopActive = currentShop.subscriptionStatus === 'active';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6" id="client-booking-view">
      {/* Barbershop Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900 text-white">
        <div className="h-44 sm:h-56 w-full relative">
          <img
            src={
              currentShop.bannerUrl ||
              'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200'
            }
            alt={currentShop.name}
            className="w-full h-full object-cover brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Content details over banner */}
        <div className="relative px-6 pb-6 pt-2 sm:px-8 sm:pb-8 -mt-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex items-start sm:items-end gap-4">
            <img
              src={
                currentShop.logoUrl ||
                'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300'
              }
              alt={currentShop.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-amber-500 shadow-xl bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentShop.name}
                </h1>
                {isShopActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" />
                    Barbearia Verificada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <AlertCircle className="w-3 h-3" />
                    Aguardando Aprovação de Mensalidade
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-2">
                {currentShop.bio}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {currentShop.address}, {currentShop.city}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {formatPhone(currentShop.phone)}
                </span>
                {currentShop.instagram && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                    {currentShop.instagram}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => {
                const text = `Olá! Gostaria de tirar uma dúvida sobre os horários na ${currentShop.name}.`;
                openWhatsApp(currentShop.phone, text);
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              Chamar no WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Booking Form Layout: 2 Columns on Desktop */}
      <form onSubmit={handleStartBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Client Data + Service Selection + Calendar (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Identification */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Seus Dados Básicos
              </h2>
              <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
                Acesso direto à agenda da barbearia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Mendes"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Choose Service */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Escolha o Serviço
                </h2>
              </div>
              {selectedService && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                  {formatCurrency(selectedService.price)}
                </span>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'todos' ? 'Todos os Serviços' : cat}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredServices.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {srv.name}
                        </h3>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-amber-500">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                        {srv.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {srv.durationMinutes} min
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {formatCurrency(srv.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Choose Date & Time */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Data e Horário
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateExtenso(selectedDate)}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2.5 py-1 rounded-xl hidden sm:inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {bookingWindowDays === 8 && 'Agenda aberta para 8 dias'}
                  {bookingWindowDays === 15 && 'Agenda aberta para 15 dias'}
                  {bookingWindowDays === 30 && 'Agenda aberta para 1 mês'}
                  {bookingWindowDays === 60 && 'Agenda aberta para 2 meses'}
                  {![8, 15, 30, 60].includes(bookingWindowDays) && `Agenda aberta para ${bookingWindowDays} dias`}
                </span>
              </span>
            </div>

            {/* Next Days Horizontal Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-5">
              {nextDays.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    type="button"
                    key={d.dateStr}
                    disabled={d.isClosed}
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setSelectedTime('');
                    }}
                    className={`min-w-[70px] p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                      d.isClosed
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : isSelected
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                      {d.dayName}
                    </span>
                    <span className="text-lg font-black my-0.5">{d.dayNum}</span>
                    <span className="text-[10px] uppercase">{d.monthName}</span>
                    {d.isClosed && (
                      <span className="text-[8px] text-rose-500 font-bold mt-0.5">Fechado</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Slots Grid */}
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Horários Disponíveis</span>
                <span className="text-slate-400 font-normal">
                  Intervalo de {currentShop.slotIntervalMinutes || 30} min
                </span>
              </div>

              {availableTimeSlots.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  A barbearia não possui horários abertos para esta data. Por favor, selecione outro dia.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableTimeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        type="button"
                        key={slot.time}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                          slot.isBooked
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 line-through cursor-not-allowed'
                            : isSelected
                            ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-transparent shadow-md scale-102'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes input */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Observações para o Barbeiro (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Prefiro acabamento mais baixo, pele sensível..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* STEP 4: Forma de Pagamento */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                4
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Forma de Pagamento
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecione como deseja realizar o pagamento
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allowedPaymentMethods.includes('pix_manual') && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('pix_manual')}
                  className={`p-4 rounded-2xl border-2 text-left transition relative flex items-start gap-3.5 cursor-pointer ${
                    selectedPaymentMethod === 'pix_manual'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    selectedPaymentMethod === 'pix_manual'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        PIX Direto
                      </span>
                      {selectedPaymentMethod === 'pix_manual' && (
                        <Check className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      QR Code / Chave PIX com envio de comprovante
                    </p>
                  </div>
                </button>
              )}

              {allowedPaymentMethods.includes('pix_automatic') && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('pix_automatic')}
                  className={`p-4 rounded-2xl border-2 text-left transition relative flex items-start gap-3.5 cursor-pointer ${
                    selectedPaymentMethod === 'pix_automatic'
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    selectedPaymentMethod === 'pix_automatic'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        PIX Automático
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-md">
                          Mercado Pago
                        </span>
                      </span>
                      {selectedPaymentMethod === 'pix_automatic' && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Confirmação instantânea em tempo real
                    </p>
                  </div>
                </button>
              )}

              {allowedPaymentMethods.includes('cash') && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`p-4 rounded-2xl border-2 text-left transition relative flex items-start gap-3.5 cursor-pointer ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    selectedPaymentMethod === 'cash'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        Dinheiro
                      </span>
                      {selectedPaymentMethod === 'cash' && (
                        <Check className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Pagamento pendente para acertar no local
                    </p>
                  </div>
                </button>
              )}

              {allowedPaymentMethods.includes('card') && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 text-left transition relative flex items-start gap-3.5 cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    selectedPaymentMethod === 'card'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        Cartão
                      </span>
                      {selectedPaymentMethod === 'card' && (
                        <Check className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Débito ou Crédito na maquininha do barbeiro
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & PIX Payment Confirmation Button (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-24 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Resumo do Agendamento
            </h2>

            {/* Itemized Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Barbearia</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {currentShop.name}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    Barbeiro: {currentShop.ownerName}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedService?.name || 'Não selecionado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duração:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedService?.durationMinutes || 0} minutos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateBr(selectedDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Horário:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {selectedTime || 'Selecione'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span className="text-slate-500">Forma de Pagamento:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedPaymentMethod === 'cash'
                      ? 'Dinheiro no Local'
                      : selectedPaymentMethod === 'card'
                      ? 'Cartão no Local'
                      : selectedPaymentMethod === 'pix_automatic'
                      ? 'PIX Automático'
                      : 'PIX Direto'}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Valor Total</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
                <div className="text-right">
                  {selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'card' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                      <Clock className="w-3 h-3" />
                      Pendente no Local
                    </span>
                  ) : selectedPaymentMethod === 'pix_automatic' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                      <Zap className="w-3 h-3" />
                      PIX Automático
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3" />
                      PIX com Comprovante
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation Box */}
            {selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'card' ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Banknote className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  Pagamento Pendente no Local ({selectedPaymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}):
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                  Seu horário será <strong>confirmado na agenda</strong> com status de <strong>Pagamento Pendente</strong>. Você realizará o acerto em {selectedPaymentMethod === 'cash' ? 'dinheiro' : 'cartão'} presencialmente na barbearia.
                </p>
              </div>
            ) : selectedPaymentMethod === 'pix_automatic' ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Zap className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  PIX Automático Mercado Pago:
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                  Geramos um QR Code dinâmico do Mercado Pago. A confirmação do agendamento ocorre em tempo real assim que o banco processar a transferência.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  PIX Direto com Envio de Comprovante:
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                  Abriremos o QR Code e chave PIX da barbearia. Basta realizar a transferência e anexar a foto ou PDF do comprovante para liberar seu horário.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedService || !selectedTime || !clientName || !clientPhone}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                !selectedService || !selectedTime || !clientName || !clientPhone
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'card'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25 hover:scale-[1.01] cursor-pointer'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 hover:scale-[1.01] cursor-pointer'
              }`}
            >
              {selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'card' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Agendamento (Pagar no Local)</span>
                </>
              ) : (
                <>
                  <span>Agendar e Abrir PIX</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('client_appointments')}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition text-center"
            >
              Já tenho agendamentos? Ver Meus Horários
            </button>
          </div>
        </div>
      </form>

      {/* Success Modal (Cash / Card - Pending Payment) */}
      {isSuccessModalOpen && createdAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center relative">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-xs font-black rounded-full mb-2 border border-amber-300 dark:border-amber-800">
                Horário Agendado com Sucesso!
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Agendamento Confirmado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Seu horário está registrado na agenda da <strong>{currentShop.name}</strong>.
              </p>
            </div>

            {/* Appointment Details Card */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Serviço:</span>
                <span className="font-bold text-slate-900 dark:text-white">{createdAppointment.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data e Horário:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatDateBr(createdAppointment.date)} às {createdAppointment.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{createdAppointment.clientName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500 font-bold">Status do Pagamento:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pendente no Local ({selectedPaymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Valor a Pagar:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(createdAppointment.servicePrice)}
                </span>
              </div>
            </div>

            {/* Push Notification Proximity Activator */}
            <div className="text-left">
              <NotificationBanner role="client" variant="compact" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const [y, m, d] = createdAppointment.date.split('-').map(Number);
                  const dayOfWeekIdx = new Date(y, m - 1, d).getDay();
                  const dayName = getDayOfWeekName(dayOfWeekIdx);
                  const text = `Olá *${currentShop.name}*! 👋\n\nAcabei de realizar um agendamento:\n\n✂️ *Serviço:* ${createdAppointment.serviceName}\n📅 *Data:* ${formatDateBr(createdAppointment.date)} (${dayName})\n⏰ *Horário:* ${createdAppointment.time}\n👤 *Cliente:* ${createdAppointment.clientName}\n📱 *WhatsApp:* ${formatPhone(createdAppointment.clientPhone)}\n💰 *Valor:* ${formatCurrency(createdAppointment.servicePrice)} (*Pagamento Pendente no Local via ${selectedPaymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}*)\n${createdAppointment.notes ? `📝 *Observações:* ${createdAppointment.notes}\n` : ''}\nFavor confirmar o recebimento. Obrigado!`;
                  openWhatsApp(currentShop.phone, text);
                }}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Reenviar Mensagem no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setSelectedTime('');
                  setNotes('');
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Concluir Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIX Payment Modal */}
      {createdAppointment && (
        <PixPaymentModal
          isOpen={isPixModalOpen}
          onClose={() => {
            setIsPixModalOpen(false);
            setSelectedTime('');
            setNotes('');
          }}
          title={`Pagamento: ${createdAppointment.serviceName}`}
          amount={createdAppointment.servicePrice}
          pixKey={currentShop.pixKey}
          pixKeyType={currentShop.pixKeyType}
          receiverName={currentShop.pixReceiverName || currentShop.name}
          description={`Agendamento ${formatDateBr(createdAppointment.date)} às ${createdAppointment.time}`}
          txId={createdAppointment.pixTransactionCode}
          barberPhone={currentShop.phone}
          barberAccessToken={currentShop.mercadoPagoAccessToken}
          clientName={createdAppointment.clientName}
          mode={selectedPaymentMethod === 'pix_automatic' ? 'pix_automatic' : 'pix_manual'}
          isConfirmed={createdAppointment.status === 'confirmed'}
          onConfirmSuccess={(paymentId, proofUrl, transactionCode) => {
            if (createdAppointment) {
              confirmAppointmentPix(createdAppointment.id, proofUrl, transactionCode);
              try {
                localStorage.setItem('barberclock_last_client_phone', createdAppointment.clientPhone);
              } catch {}
              notifyClientBookingConfirmed(createdAppointment, currentShop.name);
              notifyBarberNewBooking(createdAppointment, currentShop.name);
            }
          }}
        />
      )}
    </div>
  );
};

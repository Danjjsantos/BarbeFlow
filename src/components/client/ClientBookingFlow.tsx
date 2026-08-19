import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, Barbershop, Appointment } from '../../types';
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
    setCurrentView,
  } = useApp();

  const currentShop: Barbershop =
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

  // PIX Modal State
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Generate next 14 days list
  const nextDays = useMemo(() => {
    const list: { dateStr: string; dayNum: number; dayName: string; monthName: string; isClosed: boolean }[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
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
  }, [currentShop]);

  // Calculate available time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!currentShop || !selectedDate) return [];

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    const schedule = currentShop.workingHours?.[dayOfWeek];

    if (!schedule || !schedule.isOpen) {
      return [];
    }

    const slots: { time: string; isBooked: boolean }[] = [];
    const interval = currentShop.slotIntervalMinutes || 30;

    const [openH, openM] = schedule.openTime.split(':').map(Number);
    const [closeH, closeM] = schedule.closeTime.split(':').map(Number);

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    let breakStartMinutes = -1;
    let breakEndMinutes = -1;
    if (schedule.breakStart && schedule.breakEnd) {
      const [bsh, bsm] = schedule.breakStart.split(':').map(Number);
      const [beh, bem] = schedule.breakEnd.split(':').map(Number);
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
      // Check if inside break
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

    // Create the appointment (status pending_pix)
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

  const isShopActive = currentShop?.subscriptionStatus === 'active';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8" id="client-booking-view">
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

          {/* Barbershop selector switcher */}
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1.5 shadow-lg">
              <Building2 className="w-3.5 h-3.5 text-amber-400 ml-2" />
              <select
                value={activeBarbershopId}
                onChange={(e) => {
                  setActiveBarbershopId(e.target.value);
                  setSelectedTime('');
                }}
                className="bg-transparent text-xs font-semibold text-slate-200 py-1 pr-3 focus:outline-hidden cursor-pointer"
              >
                {barbershops.map((shop) => (
                  <option key={shop.id} value={shop.id} className="bg-slate-900 text-white">
                    {shop.name} ({shop.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Mendes"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
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
            <div className="flex items-center gap-2.5 mb-4">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações para o Barbeiro (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Prefiro acabamento mais baixo, pele sensível..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
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
              </div>

              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Valor Total</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3" />
                    PIX Instantâneo
                  </span>
                </div>
              </div>
            </div>

            {/* PIX Explanation Box */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Como funciona a confirmação:
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                Ao clicar no botão abaixo, geramos o QR Code e código Copia e Cola do PIX da barbearia. Após o pagamento, seu horário é confirmado automaticamente.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedService || !selectedTime || !clientName || !clientPhone}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                !selectedService || !selectedTime || !clientName || !clientPhone
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 hover:scale-[1.01]'
              }`}
            >
              <span>Agendar e Pagar com PIX</span>
              <ArrowRight className="w-4 h-4" />
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

      {/* PIX Payment Modal */}
      {createdAppointment && (
        <PixPaymentModal
          isOpen={isPixModalOpen}
          onClose={() => {
            setIsPixModalOpen(false);
            setCurrentView('client_appointments');
          }}
          title={`Pagamento: ${createdAppointment.serviceName}`}
          amount={createdAppointment.servicePrice}
          pixKey={currentShop.pixKey}
          pixKeyType={currentShop.pixKeyType}
          receiverName={currentShop.pixReceiverName || currentShop.name}
          description={`Agendamento ${formatDateBr(createdAppointment.date)} às ${createdAppointment.time}`}
          txId={createdAppointment.pixTransactionCode}
          barberPhone={currentShop.phone}
          isConfirmed={createdAppointment.status === 'confirmed'}
          onConfirmSuccess={() => {
            // Updated in context
          }}
        />
      )}
    </div>
  );
};

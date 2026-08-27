import React, { useState, useMemo, useRef } from 'react';
import { Barbershop, Appointment } from '../../types';
import { formatCurrency, formatDateBr, getTodayDateString } from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BarberPeriodCalendarProps {
  barbershop: Barbershop;
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenSettings?: () => void;
}

export const BarberPeriodCalendar: React.FC<BarberPeriodCalendarProps> = ({
  barbershop,
  appointments,
  selectedDate,
  onSelectDate,
  onOpenSettings,
}) => {
  const [viewMode, setViewMode] = useState<'ribbon' | 'grid'>('ribbon');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const ribbonScrollRef = useRef<HTMLDivElement>(null);

  const bookingWindowDays = barbershop.bookingWindowDays || 15;

  // Generate days in the stipulated booking period starting from today
  const periodDays = useMemo(() => {
    const list = [];
    const today = new Date();
    // Normalize to midnight
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < bookingWindowDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayOfWeek = d.getDay(); // 0 = Sunday
      const schedule = barbershop.workingHours?.[dayOfWeek];
      const isClosed = !schedule || !schedule.isOpen;

      // Filter appointments for this day for this barbershop
      const dayAppointments = appointments.filter(
        (apt) => apt.barbershopId === barbershop.id && apt.date === dateStr
      );

      const activeAppointments = dayAppointments.filter((apt) => apt.status !== 'cancelled');
      const confirmedCount = dayAppointments.filter(
        (apt) => apt.status === 'confirmed' || apt.status === 'completed'
      ).length;
      const pendingPixCount = dayAppointments.filter((apt) => apt.status === 'pending_pix').length;
      const cancelledCount = dayAppointments.filter((apt) => apt.status === 'cancelled').length;

      const dayRevenue = dayAppointments
        .filter((apt) => apt.status === 'confirmed' || apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.servicePrice || 0), 0);

      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayNameShort = isToday
        ? 'Hoje'
        : isTomorrow
        ? 'Amanhã'
        : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayFullName = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      list.push({
        dateStr,
        dateObj: d,
        dayNum: d.getDate(),
        dayOfWeek,
        dayNameShort,
        dayFullName,
        monthName,
        isToday,
        isTomorrow,
        isClosed,
        workingHours: schedule,
        totalAppointments: dayAppointments.length,
        activeCount: activeAppointments.length,
        confirmedCount,
        pendingPixCount,
        cancelledCount,
        dayRevenue,
      });
    }

    return list;
  }, [barbershop, appointments, bookingWindowDays]);

  // Summary statistics for the whole stipulated period
  const periodStats = useMemo(() => {
    const totalActiveClients = periodDays.reduce((acc, d) => acc + d.activeCount, 0);
    const totalConfirmed = periodDays.reduce((acc, d) => acc + d.confirmedCount, 0);
    const totalPending = periodDays.reduce((acc, d) => acc + d.pendingPixCount, 0);
    const totalRevenue = periodDays.reduce((acc, d) => acc + d.dayRevenue, 0);
    const daysWithClients = periodDays.filter((d) => d.activeCount > 0).length;

    // Find peak day
    let peakDay = periodDays[0];
    for (const d of periodDays) {
      if (d.activeCount > (peakDay?.activeCount || 0)) {
        peakDay = d;
      }
    }

    return {
      totalActiveClients,
      totalConfirmed,
      totalPending,
      totalRevenue,
      daysWithClients,
      peakDay,
    };
  }, [periodDays]);

  // Quick scroll controls for the ribbon
  const scrollRibbon = (direction: 'left' | 'right') => {
    if (ribbonScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      ribbonScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Build grid weeks for Grid View
  const gridWeeks = useMemo(() => {
    if (periodDays.length === 0) return [];

    const firstDate = periodDays[0].dateObj;
    const startDayOfWeek = firstDate.getDay(); // 0=Sunday

    const weeks: (typeof periodDays[0] | null)[][] = [];
    let currentWeek: (typeof periodDays[0] | null)[] = [];

    // Pad beginning of first week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of periodDays) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad ending of last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [periodDays]);

  return (
    <div
      id="barber-period-calendar-card"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Calendário da Agenda
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Período: {bookingWindowDays} dias abertos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acompanhe o número de clientes agendados dia a dia dentro do período estipulado da barbearia.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isExpanded ? 'Recolher calendário' : 'Expandir calendário'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* View Switcher & Quick Navigation */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap sm:flex-nowrap">
          {/* Mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('ribbon')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'ribbon'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualização em carrossel de dias"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Dias</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualização em grade completa do período"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
              <span>Grade</span>
            </button>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
              title="Ajustar período de dias da agenda nas configurações"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Ajustar Período</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Period Summary Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Clientes no Período
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300">
                  {periodStats.totalActiveClients}
                </span>
                <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80 font-semibold">
                  agendamento(s)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                PIX Confirmados
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {periodStats.totalConfirmed}
                </span>
                <span className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 font-semibold">
                  garantidos
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                Previsão no Período
              </span>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(periodStats.totalRevenue)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                Dias com Atendimento
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {periodStats.daysWithClients}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  de {periodDays.length} dias abertos
                </span>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: DAY RIBBON (HORIZONTALLY SCROLLABLE CAROUSEL) */}
          {viewMode === 'ribbon' && (
            <div className="relative">
              {/* Left scroll arrow */}
              <button
                type="button"
                onClick={() => scrollRibbon('left')}
                className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 items-center justify-center hover:scale-110 active:scale-95 transition"
                title="Rolar para esquerda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Scroll Container */}
              <div
                ref={ribbonScrollRef}
                className="flex items-stretch gap-2.5 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-slate-100 dark:scrollbar-track-slate-800 snap-x"
              >
                {periodDays.map((day) => {
                  const isSelected = day.dateStr === selectedDate;

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => onSelectDate(day.dateStr)}
                      className={`relative shrink-0 w-28 sm:w-32 p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between snap-start cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 dark:from-amber-500/30 dark:to-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30 font-bold'
                          : day.isClosed
                          ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Header: Day Name & Badge */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[11px] uppercase font-black truncate ${
                            isSelected
                              ? 'text-amber-700 dark:text-amber-300'
                              : day.isToday
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {day.dayNameShort}
                        </span>

                        {day.isToday && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-amber-500 text-slate-950 uppercase tracking-tighter">
                            Hoje
                          </span>
                        )}
                      </div>

                      {/* Middle: Big Day Number & Month */}
                      <div className="my-2 text-center">
                        <div
                          className={`text-2xl sm:text-3xl font-black leading-none ${
                            isSelected
                              ? 'text-slate-950 dark:text-white'
                              : day.isClosed
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {day.dayNum}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                          {day.monthName}
                        </span>
                      </div>

                      {/* Bottom Indicator: Client Count Badge */}
                      <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 w-full">
                        {day.activeCount > 0 ? (
                          <div
                            className={`px-2 py-1 rounded-xl text-center flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-1 text-[11px] font-black">
                              <Users className="w-3 h-3 shrink-0" />
                              <span>
                                {day.activeCount}{' '}
                                {day.activeCount === 1 ? 'cliente' : 'clientes'}
                              </span>
                            </div>
                            {day.pendingPixCount > 0 && !isSelected && (
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                {day.pendingPixCount} pendente PIX
                              </span>
                            )}
                          </div>
                        ) : day.isClosed ? (
                          <div className="px-2 py-1 rounded-xl text-center bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 text-[10px] font-semibold">
                            Fechado
                          </div>
                        ) : (
                          <div className="px-2 py-1 rounded-xl text-center bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                            Livre (0)
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right scroll arrow */}
              <button
                type="button"
                onClick={() => scrollRibbon('right')}
                className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 items-center justify-center hover:scale-110 active:scale-95 transition"
                title="Rolar para direita"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* VIEW MODE 2: FULL GRID CALENDAR VIEW */}
          {viewMode === 'grid' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dw, idx) => (
                  <div key={idx} className="py-1">
                    {dw}
                  </div>
                ))}
              </div>

              {/* Week Rows */}
              <div className="space-y-1.5">
                {gridWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 gap-1.5">
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${wIdx}-${dIdx}`}
                            className="min-h-[72px] sm:min-h-[82px] rounded-2xl bg-slate-50/30 dark:bg-slate-900/30 border border-dashed border-slate-200/50 dark:border-slate-800/40 opacity-30"
                          />
                        );
                      }

                      const isSelected = day.dateStr === selectedDate;

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => onSelectDate(day.dateStr)}
                          className={`min-h-[72px] sm:min-h-[82px] p-2 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30'
                              : day.isClosed
                              ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-300'
                              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-xs sm:text-sm font-black ${
                                isSelected
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : day.isToday
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : day.isClosed
                                  ? 'text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {day.dayNum}
                            </span>

                            {day.isToday && (
                              <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded-full bg-amber-500 text-slate-950">
                                Hoje
                              </span>
                            )}
                          </div>

                          {/* Client badge indicator */}
                          <div className="mt-1 w-full">
                            {day.activeCount > 0 ? (
                              <div
                                className={`px-1.5 py-0.5 sm:py-1 rounded-lg text-center font-bold text-[10px] sm:text-[11px] truncate flex items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-black'
                                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="truncate">
                                  {day.activeCount}{' '}
                                  <span className="hidden sm:inline">
                                    {day.activeCount === 1 ? 'cliente' : 'clientes'}
                                  </span>
                                </span>
                              </div>
                            ) : day.isClosed ? (
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block text-center truncate">
                                Fechado
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block text-center truncate">
                                Livre
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom legend & currently active selection notice */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Com Clientes</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Pendente PIX</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                <span>Sem Agendamentos</span>
              </span>
            </div>

            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Data selecionada:{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-bold">
                {formatDateBr(selectedDate)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

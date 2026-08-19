import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Barbershop, Service } from '../../types';
import {
  formatCurrency,
  formatPhone,
  formatDateBr,
  formatDateExtenso,
  getTodayDateString,
  openWhatsApp,
} from '../../utils/formatters';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  MessageSquare,
  PlusCircle,
  Check,
  X,
  User,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Ban,
  Send,
} from 'lucide-react';

interface BarberScheduleViewProps {
  barbershop: Barbershop;
}

export const BarberScheduleView: React.FC<BarberScheduleViewProps> = ({ barbershop }) => {
  const {
    appointments,
    services,
    confirmAppointmentPix,
    completeAppointment,
    cancelAppointment,
    createAppointment,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedAptForCancel, setSelectedAptForCancel] = useState<Appointment | null>(null);

  // Manual New Booking State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || '');
  const [newTime, setNewTime] = useState('14:00');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'pix' | 'presencial'>('pix');
  const [newNotes, setNewNotes] = useState('');

  const shopServices = services.filter((s) => s.barbershopId === barbershop.id);
  const shopAppointments = appointments.filter(
    (apt) => apt.barbershopId === barbershop.id && apt.date === selectedDate
  );

  // Filtered by status
  const filteredAppointments = shopAppointments
    .filter((apt) => (filterStatus === 'all' ? true : apt.status === filterStatus))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Daily metrics
  const totalDayRevenue = shopAppointments
    .filter((apt) => apt.status === 'confirmed' || apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.servicePrice, 0);

  const confirmedCount = shopAppointments.filter(
    (apt) => apt.status === 'confirmed' || apt.status === 'completed'
  ).length;

  const pendingPixCount = shopAppointments.filter(
    (apt) => apt.status === 'pending_pix'
  ).length;

  const cancelledCount = shopAppointments.filter(
    (apt) => apt.status === 'cancelled'
  ).length;

  // Change date helpers
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) {
      alert('Preencha o nome e telefone do cliente.');
      return;
    }

    const srv = shopServices.find((s) => s.id === newServiceId) || shopServices[0];
    if (!srv) return;

    createAppointment({
      barbershopId: barbershop.id,
      barberName: barbershop.ownerName,
      clientName: newClientName.trim(),
      clientPhone: newClientPhone.trim(),
      serviceId: srv.id,
      serviceName: srv.name,
      servicePrice: srv.price,
      durationMinutes: srv.durationMinutes,
      date: selectedDate,
      time: newTime,
      pixKeyUsed: barbershop.pixKey,
      notes: newNotes ? `[Balcão] ${newNotes}` : '[Balcão]',
      paymentMethod: newPaymentMethod,
      status: newPaymentMethod === 'presencial' ? 'confirmed' : 'pending_pix',
    });

    setIsNewBookingModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewNotes('');
  };

  const handleConfirmCancellation = (appointmentId: string, reason: string) => {
    cancelAppointment(appointmentId, reason, 'barber');
    setSelectedAptForCancel(null);
  };

  const handleResendCancellationWhatsApp = (apt: Appointment) => {
    const msg =
      `Olá *${apt.clientName}*, tudo bem?\n\n` +
      `Aqui é *${barbershop.ownerName}* da *${barbershop.name}*.\n\n` +
      `Lembrando sobre o cancelamento do seu agendamento de *${apt.serviceName}* no dia *${formatDateBr(apt.date)} às ${apt.time}*.\n` +
      `⚠️ *Motivo:* ${apt.cancellationReason || 'Imprevisto na barbearia'}\n\n` +
      `Estamos à disposição para remarcar no melhor horário para você!\n\n` +
      `Qualquer dúvida, responda a esta mensagem. Obrigado!`;
    openWhatsApp(apt.clientPhone, msg);
  };

  return (
    <div className="space-y-6" id="barber-schedule-view">
      {/* Date Header & Quick Nav */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
            >
              Hoje
            </button>
            <button
              onClick={() => handleShiftDate(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              {formatDateExtenso(selectedDate)}
            </div>
            <span className="text-xs text-slate-400 font-mono">{formatDateBr(selectedDate)}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          />
          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Agendamento Balcão
          </button>
        </div>
      </div>

      {/* Summary Stat Pills for Selected Day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total de Horários</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {shopAppointments.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-500">Confirmados / Concluídos</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {confirmedCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-500">Aguardando PIX</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingPixCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-orange-500">Faturamento do Dia</span>
          <div className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
            {formatCurrency(totalDayRevenue)}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `Todos (${shopAppointments.length})` },
          { id: 'confirmed', label: `Confirmados (${shopAppointments.filter((a) => a.status === 'confirmed').length})` },
          { id: 'pending_pix', label: `Aguardando PIX (${pendingPixCount})` },
          { id: 'completed', label: `Concluídos (${shopAppointments.filter((a) => a.status === 'completed').length})` },
          { id: 'cancelled', label: `Cancelados (${cancelledCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterStatus === tab.id
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Schedule Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Nenhum agendamento para esta data {filterStatus !== 'all' ? `com status "${filterStatus}"` : ''}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Os horários marcados pelos clientes aparecerão aqui automaticamente com status do PIX.
          </p>
          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Agendamento Manual
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                apt.status === 'confirmed'
                  ? 'border-emerald-200 dark:border-emerald-900/60 shadow-xs'
                  : apt.status === 'pending_pix'
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                  : apt.status === 'completed'
                  ? 'border-slate-200 dark:border-slate-800 opacity-90'
                  : 'border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10'
              }`}
            >
              {/* Time & Client info */}
              <div className="flex items-start gap-3.5">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 border ${
                  apt.status === 'cancelled'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                    : 'bg-slate-900 text-white dark:bg-slate-800 border-slate-700'
                }`}>
                  <span className={`text-sm font-black ${apt.status === 'cancelled' ? 'text-rose-400 line-through' : 'text-amber-400'}`}>
                    {apt.time}
                  </span>
                  <span className="text-[9px] text-slate-400">{apt.durationMinutes}m</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-extrabold text-sm sm:text-base text-slate-900 dark:text-white ${apt.status === 'cancelled' ? 'line-through text-slate-500' : ''}`}>
                      {apt.clientName}
                    </span>
                    {apt.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        PIX Confirmado
                      </span>
                    )}
                    {apt.status === 'pending_pix' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        Pendente PIX
                      </span>
                    )}
                    {apt.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        <Check className="w-3 h-3" />
                        Concluído
                      </span>
                    )}
                    {apt.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <XCircle className="w-3 h-3" />
                        {apt.cancelledBy === 'barber' ? 'Cancelado pelo Barbeiro' : 'Cancelado'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{apt.serviceName}</span>
                    <span>•</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatCurrency(apt.servicePrice)}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">{formatPhone(apt.clientPhone)}</span>
                  </div>

                  {apt.cancellationReason && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300">
                      <strong>Motivo do Cancelamento:</strong> {apt.cancellationReason}
                      {apt.cancelledAt && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">
                          Cancelado em: {apt.cancelledAt}
                        </span>
                      )}
                    </div>
                  )}

                  {apt.notes && !apt.cancellationReason && (
                    <div className="text-[11px] text-slate-400 italic">
                      Obs: {apt.notes}
                    </div>
                  )}

                  {apt.pixPaidAt && apt.status !== 'cancelled' && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      Pago via PIX em: {apt.pixPaidAt} ({apt.pixTransactionCode})
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Barber */}
              <div className="flex items-center gap-2 flex-wrap justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                {/* When Cancelled: Option to Re-send WhatsApp cancellation notice */}
                {apt.status === 'cancelled' ? (
                  <button
                    onClick={() => handleResendCancellationWhatsApp(apt)}
                    className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-rose-500/30"
                    title="Reenviar mensagem de cancelamento no WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reenviar WhatsApp</span>
                  </button>
                ) : (
                  <>
                    {/* Direct WhatsApp Contact */}
                    <button
                      onClick={() => {
                        const msg = `Olá ${apt.clientName}! Aqui é o ${barbershop.ownerName} da ${barbershop.name}. Confirmando seu horário de ${apt.serviceName} hoje às ${apt.time}.`;
                        openWhatsApp(apt.clientPhone, msg);
                      }}
                      className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-emerald-500/20"
                      title="Abrir WhatsApp com o Cliente"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>

                    {/* Confirm PIX button if pending */}
                    {apt.status === 'pending_pix' && (
                      <button
                        onClick={() => confirmAppointmentPix(apt.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Validar PIX
                      </button>
                    )}

                    {/* Mark as Completed */}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => completeAppointment(apt.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Concluir
                      </button>
                    )}

                    {/* Cancel Booking Modal Trigger */}
                    {apt.status !== 'completed' && (
                      <button
                        onClick={() => setSelectedAptForCancel(apt)}
                        className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1"
                        title="Cancelar agendamento e notificar cliente via WhatsApp"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Canceling Appointment with WhatsApp Notification */}
      {selectedAptForCancel && (
        <CancelAppointmentModal
          isOpen={true}
          onClose={() => setSelectedAptForCancel(null)}
          appointment={selectedAptForCancel}
          barbershop={barbershop}
          onConfirmCancel={handleConfirmCancellation}
        />
      )}

      {/* Modal for Manual Walk-in Booking */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setIsNewBookingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              Novo Agendamento Balcão / Manual
            </h3>

            <form onSubmit={handleManualBookingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-0000"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Serviço
                  </label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    {shopServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('pix')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      newPaymentMethod === 'pix'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    PIX (Aguardar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('presencial')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      newPaymentMethod === 'presencial'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Presencial / Balcão (Confirmado)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Cliente presencial balcão"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition text-xs"
                >
                  Registrar Horário na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


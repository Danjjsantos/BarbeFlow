import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import {
  formatCurrency,
  formatPhone,
  cleanPhone,
  formatDateBr,
  formatDateExtenso,
  openWhatsApp,
} from '../../utils/formatters';
import { PixPaymentModal } from './PixPaymentModal';
import { ClientCancelAppointmentModal } from './ClientCancelAppointmentModal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  Scissors,
  PlusCircle,
  QrCode,
  Search,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';

export const ClientMyAppointments: React.FC = () => {
  const {
    currentUser,
    appointments,
    cancelAppointment,
    confirmAppointmentPix,
    getBarbershopById,
    setCurrentView,
  } = useApp();

  const [phoneSearch, setPhoneSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPixApt, setSelectedPixApt] = useState<Appointment | null>(null);
  const [selectedCancelApt, setSelectedCancelApt] = useState<Appointment | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    serviceName: string;
    date: string;
    time: string;
  } | null>(null);

  const queryClean = phoneSearch.trim().toLowerCase();
  const queryDigits = cleanPhone(phoneSearch);

  // Privacy Protection: Only filter and show appointments when the client enters their phone number (min 8 digits)
  const isSearchActive = queryDigits.length >= 8;

  const clientAppointments = isSearchActive
    ? appointments.filter((apt) => {
        const aptPhoneClean = cleanPhone(apt.clientPhone);
        const matchesPhone = aptPhoneClean.includes(queryDigits);
        if (!matchesPhone) return false;

        if (filterStatus === 'all') return true;
        return apt.status === filterStatus;
      })
    : [];

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PIX Confirmado
          </span>
        );
      case 'pending_pix':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Aguardando PIX
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Atendimento Concluído
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
    }
  };

  const handleOpenCancelModal = (apt: Appointment) => {
    setSelectedCancelApt(apt);
  };

  const handleConfirmCancelAppointment = (aptId: string, reason: string) => {
    const targetApt = appointments.find((a) => a.id === aptId);
    cancelAppointment(aptId, reason, 'client');
    if (targetApt) {
      setSuccessBanner({
        serviceName: targetApt.serviceName,
        date: targetApt.date,
        time: targetApt.time,
      });
      // Scroll to top to see feedback
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="client-appointments-view">
      {/* Cancellation Success Feedback Banner */}
      {successBanner && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                Agendamento de {successBanner.serviceName} cancelado com sucesso!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                O horário das <strong>{successBanner.time}</strong> do dia <strong>{formatDateBr(successBanner.date)}</strong> foi liberado e já está disponível novamente na agenda da barbearia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentView('client_booking')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Agendar Novo Horário</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSuccessBanner(null)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            Meus Agendamentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulte seus horários marcados, status do pagamento PIX e histórico de atendimentos.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('client_booking')}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      {/* Phone filter bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Digite seu WhatsApp/Telefone para consultar seus horários..."
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          {phoneSearch && (
            <button
              type="button"
              onClick={() => setPhoneSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              title="Limpar pesquisa"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'confirmed', label: 'Confirmados' },
            { id: 'pending_pix', label: 'Pendentes PIX' },
            { id: 'completed', label: 'Concluídos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {clientAppointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
            <Scissors className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {!isSearchActive
              ? 'Consulte seus agendamentos'
              : 'Nenhum agendamento encontrado'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {!isSearchActive
              ? 'Por privacidade, digite o número do seu telefone/WhatsApp no campo acima para localizar apenas os seus horários agendados.'
              : 'Não encontramos nenhum horário marcado para o telefone informado. Verifique o número digitado ou faça um novo agendamento.'}
          </p>
          <button
            onClick={() => setCurrentView('client_booking')}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Agendar Horário na Barbearia
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {clientAppointments.map((apt) => {
            const shop = getBarbershopById(apt.barbershopId);
            return (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={
                      shop?.logoUrl ||
                      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300'
                    }
                    alt={shop?.name || 'Barbearia'}
                    className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40 shrink-0 bg-slate-800"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        {apt.serviceName}
                      </span>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {shop?.name || 'Barbearia'} • Barbeiro: {apt.barberName}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        {formatDateBr(apt.date)}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        {apt.time} ({apt.durationMinutes} min)
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(apt.servicePrice)}
                      </span>
                    </div>

                    {apt.cancellationReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-0.5">
                        <div className="font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Cancelado por: {apt.cancelledBy === 'barber' ? 'Barbeiro / Barbearia' : 'Você'}
                        </div>
                        <div className="text-[11px] text-rose-700 dark:text-rose-300">
                          <strong>Motivo:</strong> {apt.cancellationReason}
                        </div>
                        {apt.cancelledAt && (
                          <div className="text-[10px] text-rose-500">
                            Data do cancelamento: {apt.cancelledAt}
                          </div>
                        )}
                      </div>
                    )}

                    {apt.notes && !apt.cancellationReason && (
                      <p className="text-[11px] text-slate-400 italic">
                        Obs: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 justify-end">
                  {apt.status === 'pending_pix' && (
                    <button
                      onClick={() => setSelectedPixApt(apt)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Pagar com PIX
                    </button>
                  )}

                  {shop?.phone && apt.status === 'cancelled' && (
                    <button
                      onClick={() => {
                        const msg = `Olá ${apt.barberName}! Vi que meu agendamento de ${apt.serviceName} no dia ${formatDateBr(apt.date)} às ${apt.time} foi cancelado. Gostaria de remarcar para outro horário.`;
                        openWhatsApp(shop.phone, msg);
                      }}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Remarcar via WhatsApp
                    </button>
                  )}

                  {shop?.phone && apt.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        const msg = `Olá ${apt.barberName}! Gostaria de confirmar meu agendamento de ${apt.serviceName} no dia ${formatDateBr(apt.date)} às ${apt.time}.`;
                        openWhatsApp(shop.phone, msg);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      WhatsApp
                    </button>
                  )}

                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => handleOpenCancelModal(apt)}
                      className="px-3.5 py-2 text-rose-600 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Cancelar este agendamento e liberar o horário na barbearia"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Cancellation Modal */}
      {selectedCancelApt && (
        <ClientCancelAppointmentModal
          isOpen={true}
          onClose={() => setSelectedCancelApt(null)}
          appointment={selectedCancelApt}
          barbershop={getBarbershopById(selectedCancelApt.barbershopId)}
          onConfirmCancel={handleConfirmCancelAppointment}
        />
      )}

      {/* PIX Modal for selected appointment */}
      {selectedPixApt && (
        <PixPaymentModal
          isOpen={true}
          onClose={() => setSelectedPixApt(null)}
          title={`Pagar PIX: ${selectedPixApt.serviceName}`}
          amount={selectedPixApt.servicePrice}
          pixKey={getBarbershopById(selectedPixApt.barbershopId)?.pixKey || 'pix@barberhub.com.br'}
          pixKeyType={getBarbershopById(selectedPixApt.barbershopId)?.pixKeyType}
          receiverName={getBarbershopById(selectedPixApt.barbershopId)?.pixReceiverName || 'BARBEARIA'}
          description={`Agendamento ${formatDateBr(selectedPixApt.date)} às ${selectedPixApt.time}`}
          txId={selectedPixApt.pixTransactionCode}
          barberPhone={getBarbershopById(selectedPixApt.barbershopId)?.phone}
          appointmentId={selectedPixApt.id}
          barberAccessToken={getBarbershopById(selectedPixApt.barbershopId)?.mercadoPagoAccessToken}
          clientEmail={selectedPixApt.clientPhone + '@cliente.com'}
          clientName={selectedPixApt.clientName}
          isConfirmed={selectedPixApt.status === 'confirmed'}
          onConfirmSuccess={() => {
            confirmAppointmentPix(selectedPixApt.id);
          }}
        />
      )}
    </div>
  );
};

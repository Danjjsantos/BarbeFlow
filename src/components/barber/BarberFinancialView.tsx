import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Barbershop, Appointment } from '../../types';
import {
  formatCurrency,
  formatPhone,
  formatDateBr,
  getTodayDateString,
} from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Users,
  PieChart,
  ArrowUpRight,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Receipt,
} from 'lucide-react';

interface BarberFinancialViewProps {
  barbershop: Barbershop;
}

export const BarberFinancialView: React.FC<BarberFinancialViewProps> = ({ barbershop }) => {
  const { appointments, services } = useApp();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const todayStr = getTodayDateString();

  // Filter appointments for this barbershop
  const shopAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.barbershopId === barbershop.id);
  }, [appointments, barbershop.id]);

  // Filter by selected period
  const filteredAppointments = useMemo(() => {
    const today = new Date();
    return shopAppointments.filter((apt) => {
      if (period === 'today') {
        return apt.date === todayStr;
      }
      if (period === 'week') {
        const [y, m, d] = apt.date.split('-').map(Number);
        const aptDate = new Date(y, m - 1, d);
        const diffDays = (today.getTime() - aptDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= -1 && diffDays <= 7;
      }
      if (period === 'month') {
        const [y, m] = apt.date.split('-');
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currentYear = String(today.getFullYear());
        return y === currentYear && m === currentMonth;
      }
      return true; // all
    });
  }, [shopAppointments, period, todayStr]);

  // Financial calculations
  const confirmedAppointments = filteredAppointments.filter(
    (apt) => apt.status === 'confirmed' || apt.status === 'completed'
  );

  const totalRevenue = confirmedAppointments.reduce(
    (sum, apt) => sum + apt.servicePrice,
    0
  );

  const pendingRevenue = filteredAppointments
    .filter((apt) => apt.status === 'pending_pix')
    .reduce((sum, apt) => sum + apt.servicePrice, 0);

  const totalCuts = confirmedAppointments.length;
  const averageTicket = totalCuts > 0 ? totalRevenue / totalCuts : 0;

  // PIX vs Presencial Breakdown
  const pixRevenue = confirmedAppointments
    .filter((apt) => apt.paymentMethod === 'pix' || apt.pixPaidAt)
    .reduce((sum, apt) => sum + apt.servicePrice, 0);

  const presencialRevenue = totalRevenue - pixRevenue;

  // Services Breakdown
  const serviceStats = useMemo(() => {
    const map: { [key: string]: { name: string; count: number; total: number } } = {};
    confirmedAppointments.forEach((apt) => {
      if (!map[apt.serviceName]) {
        map[apt.serviceName] = { name: apt.serviceName, count: 0, total: 0 };
      }
      map[apt.serviceName].count += 1;
      map[apt.serviceName].total += apt.servicePrice;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [confirmedAppointments]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="barber-financial-view">
      {/* Header with period filter */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Gestão de Rendimentos & Faturamento
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe a evolução das suas receitas, confirmações de PIX e ticket médio da barbearia.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: '7 Dias' },
              { id: 'month', label: 'Este Mês' },
              { id: 'all', label: 'Tudo' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            title="Imprimir Relatório"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Confirmed Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Rendimento Confirmado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalCuts} atendimentos realizados</span>
          </div>
        </div>

        {/* Pending PIX */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Aguardando PIX
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(pendingRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {filteredAppointments.filter((a) => a.status === 'pending_pix').length} clientes pendentes
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(averageTicket)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Média por cliente atendido
          </div>
        </div>

        {/* PIX Share */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Recebimentos via PIX
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">
            {formatCurrency(pixRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {totalRevenue > 0 ? Math.round((pixRevenue / totalRevenue) * 100) : 0}% do faturamento
          </div>
        </div>
      </div>

      {/* Services Ranking & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Services Revenue Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-500" />
            Desempenho por Serviço
          </h3>

          {serviceStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhum atendimento confirmado no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {serviceStats.map((item, idx) => {
                const percent = totalRevenue > 0 ? (item.total / totalRevenue) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">
                        {idx + 1}. {item.name} ({item.count} cortes)
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.total)} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Canais de Pagamento
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Divisão entre pagamentos digitais PIX e balcão presencial
            </p>
          </div>

          <div className="space-y-3 my-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  PIX Automático no App
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {confirmedAppointments.filter((a) => a.paymentMethod === 'pix').length} transações
                </span>
              </div>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {formatCurrency(pixRevenue)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Balcão / Presencial
                </span>
                <span className="text-xs text-slate-500">
                  {confirmedAppointments.filter((a) => a.paymentMethod === 'presencial').length} transações
                </span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {formatCurrency(presencialRevenue)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            Chave PIX cadastrada para recebimento:{' '}
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{barbershop.pixKey}</strong>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Extrato Detalhado de Atendimentos
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Serviço</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Nenhum registro encontrado para este período.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatDateBr(apt.date)} às {apt.time}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {apt.clientName}
                      </span>
                      <span className="text-slate-400 text-[11px]">{formatPhone(apt.clientPhone)}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {apt.serviceName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {apt.paymentMethod === 'pix' ? 'PIX' : 'Presencial'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(apt.servicePrice)}
                    </td>
                    <td className="py-3 px-4">
                      {apt.status === 'confirmed' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">PIX Confirmado</span>
                      )}
                      {apt.status === 'pending_pix' && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Pendente PIX</span>
                      )}
                      {apt.status === 'completed' && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold">Concluído</span>
                      )}
                      {apt.status === 'cancelled' && (
                        <span className="text-rose-500 font-bold">Cancelado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

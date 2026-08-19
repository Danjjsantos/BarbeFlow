import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, ServiceCategory, Barbershop } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Scissors,
  PlusCircle,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BarberServicesViewProps {
  barbershop: Barbershop;
}

export const BarberServicesView: React.FC<BarberServicesViewProps> = ({ barbershop }) => {
  const { services, addService, updateService, deleteService } = useApp();

  const shopServices = services.filter((s) => s.barbershopId === barbershop.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('35');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [category, setCategory] = useState<ServiceCategory>('cabelo');
  const [active, setActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('35');
    setDurationMinutes('30');
    setCategory('cabelo');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setDescription(srv.description);
    setPrice(String(srv.price));
    setDurationMinutes(String(srv.durationMinutes));
    setCategory(srv.category);
    setActive(srv.active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numPrice = parseFloat(price) || 0;
    const numDuration = parseInt(durationMinutes) || 30;

    if (editingService) {
      updateService(editingService.id, {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        durationMinutes: numDuration,
        category,
        active,
      });
    } else {
      addService({
        barbershopId: barbershop.id,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        durationMinutes: numDuration,
        category,
        active,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (srv: Service) => {
    if (window.confirm(`Deseja realmente excluir o serviço "${srv.name}"?`)) {
      deleteService(srv.id);
    }
  };

  return (
    <div className="space-y-6" id="barber-services-view">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-500" />
            Catálogo de Serviços & Tabela de Preços
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre os serviços oferecidos pela sua barbearia com tempo de duração e valor cobrado via PIX.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Adicionar Novo Serviço
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shopServices.map((srv) => (
          <div
            key={srv.id}
            className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition flex flex-col justify-between shadow-xs ${
              srv.active
                ? 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-900/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {srv.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    srv.active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {srv.active ? 'Disponível na Agenda' : 'Pausado'}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                {srv.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {srv.description || 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Preço e Duração
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {formatCurrency(srv.price)}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {srv.durationMinutes} min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  title="Editar serviço"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(srv)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                  title="Excluir serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Scissors className="w-5 h-5 text-amber-500" />
              {editingService ? 'Editar Serviço' : 'Novo Serviço da Barbearia'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê com Navalha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    min="0"
                    placeholder="35.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Duração (minutos) *
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="75">1h15</option>
                    <option value="90">1h30</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold capitalize"
                >
                  <option value="cabelo">Cabelo</option>
                  <option value="barba">Barba</option>
                  <option value="combo">Combo (Corte + Barba)</option>
                  <option value="sobrancelha">Sobrancelha</option>
                  <option value="quimica">Química / Platinado</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Descrição dos detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Inclui lavagem com shampoo premium, toalha quente e pomada modeladora..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="srv-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                />
                <label htmlFor="srv-active" className="text-xs font-semibold cursor-pointer">
                  Disponibilizar para agendamento online dos clientes
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition text-xs"
                >
                  {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

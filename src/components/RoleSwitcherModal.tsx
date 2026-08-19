import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, PixKeyType } from '../types';
import {
  X,
  UserCheck,
  Shield,
  Scissors,
  User as UserIcon,
  PlusCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Building2,
  Phone,
  CreditCard,
  Palette,
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    barbershops,
    registerNewBarbershop,
    resetToDefaultData,
    platformSettings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'switch' | 'register'>('switch');

  // Register New Barber State
  const [barberName, setBarberName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('phone');
  const [themeColor, setThemeColor] = useState('#d97706');
  const [bio, setBio] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberName || !shopName || !phone || !pixKey) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const newShop = registerNewBarbershop({
      barberName,
      shopName,
      phone,
      address: address || 'Endereço Comercial Central',
      city: city || 'São Paulo',
      pixKey,
      pixKeyType,
      themeColor,
      bio: bio || 'Barbearia moderna com agendamento online e pagamento facilitado.',
    });

    setRegisteredSuccess(true);
    setTimeout(() => {
      // Find created user
      setRegisteredSuccess(false);
      onClose();
    }, 1500);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração iniciais?')) {
      resetToDefaultData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        id="role-switcher-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Alternar Perfil & Demonstração
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Escolha entre perfis de Cliente, Barbeiro ou Administrador Geral para testar todas as funcionalidades do app.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'switch'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Perfis Disponíveis
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Cadastrar Nova Barbearia
          </button>
        </div>

        {activeTab === 'switch' ? (
          <div className="space-y-4">
            {/* Super Admin Section */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                Administrador Geral (Plataforma)
              </div>
              {users
                .filter((u) => u.role === 'super_admin')
                .map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                      currentUser.id === user.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-100 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {user.name}
                          {currentUser.id === user.id && (
                            <span className="text-[10px] bg-orange-600 text-white font-bold px-2 py-0.5 rounded-full">
                              Atual
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Aprova cadastro de barbeiros, gere taxas mensais e configurações globais
                        </div>
                      </div>
                    </div>
                    <UserCheck className={`w-5 h-5 ${currentUser.id === user.id ? 'text-orange-600' : 'text-slate-300'}`} />
                  </button>
                ))}
            </div>

            {/* Barbers Section */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                Barbeiros / Administradores de Barbearia
              </div>
              <div className="space-y-2">
                {users
                  .filter((u) => u.role === 'barber')
                  .map((user) => {
                    const shop = barbershops.find((s) => s.id === user.barbershopId);
                    const isPending = shop?.subscriptionStatus === 'pending';
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                          currentUser.id === user.id
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
                          />
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-2">
                              {user.name}
                              {currentUser.id === user.id && (
                                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">
                                  Atual
                                </span>
                              )}
                              {isPending && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                                  Aguardando Aprovação
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {shop ? `${shop.name} • ${shop.city}` : 'Barbearia'}
                            </div>
                          </div>
                        </div>
                        <UserCheck className={`w-5 h-5 ${currentUser.id === user.id ? 'text-amber-600' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Clients Section */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                Clientes
              </div>
              <div className="space-y-2">
                {users
                  .filter((u) => u.role === 'client')
                  .map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                        currentUser.id === user.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-blue-500/40"
                        />
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {user.name}
                            {currentUser.id === user.id && (
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Telefone: {user.phone} • Visualiza agenda e agenda com PIX
                          </div>
                        </div>
                      </div>
                      <UserCheck className={`w-5 h-5 ${currentUser.id === user.id ? 'text-blue-600' : 'text-slate-300'}`} />
                    </button>
                  ))}
              </div>
            </div>

            {/* Reset data */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleResetData}
                className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1.5 transition py-1 px-2 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar dados de teste padrão
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
            {registeredSuccess ? (
              <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-lg text-emerald-800 dark:text-emerald-300">
                  Cadastro Enviado com Sucesso!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Sua barbearia foi cadastrada e agora aguarda aprovação da taxa mensal pelo Administrador Geral da plataforma.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong>Taxa Mensal da Plataforma:</strong> R$ {platformSettings.monthlyFee.toFixed(2)}/mês.
                    Após o cadastro, o administrador geral validará seu pagamento via PIX para liberar o acesso público da sua agenda.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Nome do Barbeiro *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Rodrigo Santos"
                      value={barberName}
                      onChange={(e) => setBarberName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Nome da Barbearia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Imperial Barber Shop"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      WhatsApp / Celular *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-8888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Endereço da Barbearia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rua dos Barbeiros, 120 - Centro"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Tipo de Chave PIX
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="phone">Telefone</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Chave PIX para receber dos clientes *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: seuemail@pix.com.br ou 11999998888"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Cor de Destaque da Barbearia
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { hex: '#d97706', name: 'Dourado / Âmbar' },
                      { hex: '#059669', name: 'Esmeralda Vintage' },
                      { hex: '#2563eb', name: 'Azul Real' },
                      { hex: '#dc2626', name: 'Vermelho Navalha' },
                      { hex: '#7c3aed', name: 'Roxo Moderno' },
                      { hex: '#0f172a', name: 'Preto Premium' },
                    ].map((col) => (
                      <button
                        type="button"
                        key={col.hex}
                        onClick={() => setThemeColor(col.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          themeColor === col.hex ? 'scale-125 border-amber-500 ring-2 ring-amber-400/30' : 'border-white dark:border-slate-800'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Bio / Apresentação da Barbearia
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descreva a proposta da sua barbearia para os clientes..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Criar Barbearia & Solicitar Adesão
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

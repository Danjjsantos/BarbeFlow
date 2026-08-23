import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  User as UserIcon,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  Sparkles,
  Trash2,
  Phone,
  Mail,
  Shield,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  {
    label: 'Executivo 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Executivo 2',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Executivo 3',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Executiva 1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Barber Master',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Tech Admin',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  },
];

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // Process image file to base64 DataURL (with client-side resizing for optimal storage)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'A imagem selecionada deve ter menos de 8MB.' });
      return;
    }

    setIsLoadingFile(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Optimize and resize image using canvas to ensure fast performance and compact storage
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400; // 400x400 max avatar dimension
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
            setAvatarUrl(optimizedBase64);
            setIsLoadingFile(false);
            setFeedback({ type: 'success', message: 'Foto carregada do armazenamento com sucesso!' });
          } else {
            setAvatarUrl(result);
            setIsLoadingFile(false);
          }
        };
        img.onerror = () => {
          setAvatarUrl(result);
          setIsLoadingFile(false);
        };
        img.src = result;
      } else {
        setIsLoadingFile(false);
      }
    };
    reader.onerror = () => {
      setIsLoadingFile(false);
      setFeedback({ type: 'error', message: 'Falha ao ler o arquivo de imagem do dispositivo.' });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setAvatarUrl(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    setFeedback({ type: 'success', message: 'Link da foto aplicado!' });
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    setFeedback({ type: 'success', message: 'Foto removida. Será exibido o ícone padrão.' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'O nome do administrador não pode ficar em branco.' });
      return;
    }

    const res = updateUserProfile(currentUser.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (res.success) {
      setFeedback({ type: 'success', message: 'Perfil e foto atualizados com sucesso!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Erro ao salvar alterações.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-600/30 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                Perfil do Administrador Geral
              </h3>
              <p className="text-xs text-slate-400">
                Altere sua foto de perfil, dados de contato e identificação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Avatar Section & Storage Upload */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-400" />
                <span>Foto de Perfil do Administrador</span>
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Photo Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-orange-500/70 shadow-xl shadow-orange-500/20 bg-slate-900 flex items-center justify-center">
                  {isLoadingFile ? (
                    <div className="flex flex-col items-center justify-center gap-1 text-orange-400">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="text-[10px] font-bold">Processando...</span>
                    </div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar do Administrador"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white">
                      <Shield className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg border-2 border-slate-900 transition active:scale-95 cursor-pointer"
                  title="Alterar foto pelo armazenamento"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Drop Zone & Actions */}
              <div className="flex-1 w-full space-y-2.5">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="admin-avatar-file-input"
                />

                {/* Drag and drop button area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                    isDragging
                      ? 'border-orange-500 bg-orange-500/15'
                      : 'border-slate-700/80 hover:border-orange-500/60 bg-slate-900/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">
                      Buscar foto do armazenamento
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Clique para abrir seus arquivos ou arraste uma imagem (PNG, JPG, WEBP)
                    </p>
                  </div>
                </div>

                {/* Direct URL or Presets Toggle */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] font-bold text-slate-400 hover:text-orange-400 flex items-center gap-1.5 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{showUrlInput ? 'Ocultar URL' : 'Informar URL de Imagem'}</span>
                  </button>

                  <span className="text-[10px] text-slate-500">Ou escolha um modelo abaixo</span>
                </div>

                {/* URL Input Form */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://exemplo.com/minha-foto.jpg"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Sugestões de Avatares Profissionais:
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.url);
                      setFeedback({ type: 'success', message: `Avatar "${preset.label}" selecionado!` });
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition hover:scale-105 cursor-pointer ${
                      avatarUrl === preset.url
                        ? 'border-orange-500 ring-2 ring-orange-500/40'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    {avatarUrl === preset.url && (
                      <div className="absolute inset-0 bg-orange-600/40 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields: Name, Email, Phone */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome do Administrador Geral
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Danilo Santos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email de Acesso / Contato
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@barberclock.com.br"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

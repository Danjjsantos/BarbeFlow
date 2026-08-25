import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  Trash2,
  Eye,
  Camera,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';

// Curated storage presets for Profile Avatars / Logos
export const LOGO_PRESETS = [
  {
    id: 'logo_vintage_1',
    name: 'Navalha Real Dourada',
    category: 'Emblemas Dourados',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
  },
  {
    id: 'logo_barber_pro',
    name: 'Mestre Barbeiro em Ação',
    category: 'Profissional',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  },
  {
    id: 'logo_barber_classic',
    name: 'Estilo Clássico Cavalheiro',
    category: 'Clássico',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400',
  },
  {
    id: 'logo_urban_fade',
    name: 'Corte Moderno & Fade',
    category: 'Urbano',
    url: 'https://images.unsplash.com/photo-1517832606589-7629c3397143?w=400',
  },
  {
    id: 'logo_scissors_leather',
    name: 'Tesoura & Couro Vintage',
    category: 'Vintage',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400',
  },
  {
    id: 'logo_gentleman_dark',
    name: 'Silhueta Gentleman',
    category: 'Minimalista',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
  },
];

// Curated storage presets for Background Banners / Covers
export const BANNER_PRESETS = [
  {
    id: 'banner_leather_chairs',
    name: 'Poltronas de Couro & Espelhos Iluminados',
    category: 'Salão Sofisticado',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200',
  },
  {
    id: 'banner_brick_vintage',
    name: 'Tijolos Rústicos & Iluminação Quente',
    category: 'Rústico / Vintage',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200',
  },
  {
    id: 'banner_dark_lounge',
    name: 'Lounge Escuro com Luz Âmbar',
    category: 'Dark Luxury',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200',
  },
  {
    id: 'banner_tools_wood',
    name: 'Bancada com Máquinas e Pentes',
    category: 'Equipamentos',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200',
  },
  {
    id: 'banner_modern_interior',
    name: 'Barbearia Contemporânea Clean',
    category: 'Moderno',
    url: 'https://images.unsplash.com/photo-1517832606589-7629c3397143?w=1200',
  },
  {
    id: 'banner_industrial',
    name: 'Estúdio Industrial Aço & Madeira',
    category: 'Industrial',
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200',
  },
];

interface BarbershopMediaManagerProps {
  currentLogo: string;
  currentBanner: string;
  onLogoChange: (url: string) => void;
  onBannerChange: (url: string) => void;
  shopName: string;
}

export const BarbershopMediaManager: React.FC<BarbershopMediaManagerProps> = ({
  currentLogo,
  currentBanner,
  onLogoChange,
  onBannerChange,
  shopName,
}) => {
  const [activeMediaTarget, setActiveMediaTarget] = useState<'logo' | 'banner'>('logo');
  const [activeSourceMode, setActiveSourceMode] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload to DataURL (Base64) - Works in memory / local storage
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. Por favor, envie uma imagem de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (activeMediaTarget === 'logo') {
          onLogoChange(result);
          setUploadFeedback('Foto de perfil atualizada a partir do seu arquivo!');
        } else {
          onBannerChange(result);
          setUploadFeedback('Imagem de fundo/capa atualizada a partir do seu arquivo!');
        }
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
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

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    if (activeMediaTarget === 'logo') {
      onLogoChange(customUrlInput.trim());
      setUploadFeedback('URL da foto de perfil aplicada!');
    } else {
      onBannerChange(customUrlInput.trim());
      setUploadFeedback('URL da imagem de fundo aplicada!');
    }
    setCustomUrlInput('');
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  return (
    <div className="space-y-6" id="barbershop-media-manager">
      {/* Live Composite Preview Card */}
      <div className="bg-slate-950 rounded-3xl p-4 sm:p-6 border border-slate-800 text-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-200">
              Prévia em Tempo Real (Como o cliente visualiza no agendamento)
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {activeMediaTarget === 'logo' ? 'Editando Foto de Perfil' : 'Editando Imagem de Fundo'}
          </span>
        </div>

        {/* Mock Live Client Hero Header */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group">
          {/* Banner Container */}
          <div className="h-36 sm:h-44 w-full relative">
            <img
              src={
                currentBanner ||
                'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200'
              }
              alt="Capa da Barbearia"
              className="w-full h-full object-cover brightness-60 transition duration-300 group-hover:scale-101"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <button
              type="button"
              onClick={() => setActiveMediaTarget('banner')}
              className={`absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                activeMediaTarget === 'banner'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Trocar Imagem de Fundo (Capa)</span>
            </button>
          </div>

          {/* Logo & Info Container */}
          <div className="relative px-5 pb-5 -mt-12 flex items-end gap-3.5 sm:gap-4">
            <div className="relative group/logo">
              <img
                src={
                  currentLogo ||
                  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300'
                }
                alt="Foto de Perfil / Logo"
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 border-amber-500 shadow-xl bg-slate-800 transition ${
                  activeMediaTarget === 'logo' ? 'ring-4 ring-amber-400' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveMediaTarget('logo')}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white transition"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Alterar</span>
              </button>
            </div>

            <div className="flex-1 pb-1">
              <h3 className="text-base sm:text-lg font-black text-white">{shopName}</h3>
              <p className="text-[11px] text-slate-300">
                Foto de perfil e imagem de fundo personalizadas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveMediaTarget('logo')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                activeMediaTarget === 'logo'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Trocar Foto de Perfil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Controls & Storage Options */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        {/* Step 1: Target Selection Tabs (Logo vs Banner) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-500" />
              Selecione o que deseja alterar:
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Envie do seu dispositivo ou escolha modelos de alta resolução da galeria.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveMediaTarget('logo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeMediaTarget === 'logo'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto de Perfil / Logo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMediaTarget('banner')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeMediaTarget === 'banner'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Imagem de Fundo (Capa)</span>
            </button>
          </div>
        </div>

        {/* Step 2: Source Mode Selection (Upload vs Galeria Presets vs URL) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSourceMode('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSourceMode === 'upload'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload do Dispositivo / Arquivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceMode('presets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSourceMode === 'presets'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Galeria de Armazenamento Pronta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceMode('url')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSourceMode === 'url'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link / URL Direta</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {uploadFeedback && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{uploadFeedback}</span>
          </div>
        )}

        {/* Option A: Upload from Device / Storage */}
        {activeSourceMode === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-amber-500'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Clique para escolher uma imagem do seu celular/computador ou arraste aqui
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Formatos suportados: PNG, JPG, WEBP, GIF (máximo 5MB).
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
              >
                Selecionar Imagem do Armazenamento
              </button>
            </div>
          </div>
        )}

        {/* Option B: Preset Gallery from Storage */}
        {activeSourceMode === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Selecione uma imagem de alta qualidade pré-armazenada na galeria:
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {activeMediaTarget === 'logo'
                  ? `${LOGO_PRESETS.length} modelos de perfil`
                  : `${BANNER_PRESETS.length} modelos de fundo`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activeMediaTarget === 'logo' ? LOGO_PRESETS : BANNER_PRESETS).map((preset) => {
                const isSelected =
                  (activeMediaTarget === 'logo' && currentLogo === preset.url) ||
                  (activeMediaTarget === 'banner' && currentBanner === preset.url);

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      if (activeMediaTarget === 'logo') {
                        onLogoChange(preset.url);
                        setUploadFeedback(`Foto de perfil alterada para "${preset.name}"!`);
                      } else {
                        onBannerChange(preset.url);
                        setUploadFeedback(`Imagem de fundo alterada para "${preset.name}"!`);
                      }
                      setTimeout(() => setUploadFeedback(null), 3000);
                    }}
                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition group flex flex-col ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <div className="h-24 sm:h-28 w-full relative bg-slate-800 overflow-hidden">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 font-bold" />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-xs text-[9px] font-bold text-white">
                        {preset.category}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 flex-1 flex flex-col justify-between">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {preset.name}
                      </p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        {isSelected ? '✓ Selecionado' : 'Clique para usar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Option C: Direct Web URL */}
        {activeSourceMode === 'url' && (
          <form onSubmit={handleApplyCustomUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cole a URL pública da imagem ({activeMediaTarget === 'logo' ? 'Foto de Perfil' : 'Imagem de Fundo'}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/minha-imagem.jpg"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-black placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!customUrlInput.trim()}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shrink-0"
                >
                  Aplicar URL
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

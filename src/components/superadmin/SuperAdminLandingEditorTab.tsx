import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LandingPageContent,
  LandingGalleryImage,
  LandingFeature,
  LandingTestimonial,
  LandingFaq,
} from '../../types';
import { generateId } from '../../utils/formatters';
import { parseVideoUrl } from '../../utils/videoUtils';
import {
  Video,
  Type,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  Eye,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  Star,
  Play,
  Upload,
  FolderOpen,
  RotateCcw,
  Link2,
  RefreshCw,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  User,
  Quote,
  MapPin,
  Building2,
  TrendingUp,
} from 'lucide-react';

const TESTIMONIAL_AVATAR_PRESETS = [
  { label: 'Barbeiro 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 4', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 5', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Barbeira 6', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
];

const DEFAULT_RECOMMENDED_TESTIMONIALS: LandingTestimonial[] = [
  {
    id: 'test_1',
    name: 'Carlos Silva',
    shopName: 'Barbearia Navalha de Ouro',
    city: 'São Paulo - SP',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    comment: 'Antes eu perdia horas no WhatsApp respondendo cliente enquanto cortava cabelo. Hoje minha agenda enche sozinha e o dinheiro do PIX cai direto na minha conta antes do cliente sentar na cadeira!',
    rating: 5,
    revenueGrowth: '+42% faturamento',
  },
  {
    id: 'test_2',
    name: 'Marcos Rocha',
    shopName: 'Vintage Barber Club',
    city: 'São Paulo - SP',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    comment: 'O QR Code no balcão foi um divisor de águas. O cliente já sai de um corte e escaneia para marcar o próximo. A taxa mensal da plataforma se paga no primeiro dia do mês.',
    rating: 5,
    revenueGrowth: 'Zero faltas',
  },
  {
    id: 'test_3',
    name: 'Thiago Lima',
    shopName: 'Studio Barber Prime',
    city: 'São Paulo - SP',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    comment: 'O suporte do administrador geral é impecável e a aprovação foi super rápida. Recomendo para qualquer barbeiro que quer profissionalizar seu negócio.',
    rating: 5,
    revenueGrowth: '+15 novos clientes/semana',
  },
];

export const SuperAdminLandingEditorTab: React.FC = () => {
  const { landingPageContent, updateLandingPageContent, setCurrentView } = useApp();

  const [activeSection, setActiveSection] = useState<
    'branding' | 'video' | 'texts' | 'gallery' | 'features' | 'testimonials' | 'faqs'
  >('branding');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state initialized with landingPageContent
  const [brandLogoUrl, setBrandLogoUrl] = useState(
    landingPageContent.brandLogoUrl || '/barber_clock_logo.jpg'
  );
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isLoadingLogoFile, setIsLoadingLogoFile] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [heroTag, setHeroTag] = useState(landingPageContent.heroTag);
  const [heroTitle, setHeroTitle] = useState(landingPageContent.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(landingPageContent.heroSubtitle);
  const [heroCtaText, setHeroCtaText] = useState(landingPageContent.heroCtaText);

  const [videoUrl, setVideoUrl] = useState(landingPageContent.videoUrl);
  const [videoTitle, setVideoTitle] = useState(landingPageContent.videoTitle);
  const [videoDescription, setVideoDescription] = useState(landingPageContent.videoDescription);
  const [videoPosterUrl, setVideoPosterUrl] = useState(landingPageContent.videoPosterUrl);

  const [galleryImages, setGalleryImages] = useState<LandingGalleryImage[]>([
    ...landingPageContent.galleryImages,
  ]);
  const [features, setFeatures] = useState<LandingFeature[]>([
    ...landingPageContent.features,
  ]);
  const [testimonials, setTestimonials] = useState<LandingTestimonial[]>([
    ...landingPageContent.testimonials,
  ]);
  const [faqs, setFaqs] = useState<LandingFaq[]>([...landingPageContent.faqs]);

  const [ctaTitle, setCtaTitle] = useState(landingPageContent.ctaTitle);
  const [ctaSubtitle, setCtaSubtitle] = useState(landingPageContent.ctaSubtitle);
  const [ctaButtonText, setCtaButtonText] = useState(landingPageContent.ctaButtonText);

  // Helper state for adding items
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  // Helper states for Testimonials management
  const [activeTestimonialSubView, setActiveTestimonialSubView] = useState<'list' | 'add' | 'preview'>('list');
  const [newTestName, setNewTestName] = useState('');
  const [newTestShopName, setNewTestShopName] = useState('');
  const [newTestCity, setNewTestCity] = useState('');
  const [newTestAvatarUrl, setNewTestAvatarUrl] = useState(TESTIMONIAL_AVATAR_PRESETS[0].url);
  const [newTestComment, setNewTestComment] = useState('');
  const [newTestRating, setNewTestRating] = useState<number>(5);
  const [newTestRevenueGrowth, setNewTestRevenueGrowth] = useState('+40% faturamento');
  const [isLoadingTestAvatar, setIsLoadingTestAvatar] = useState(false);
  const [testimonialFeedback, setTestimonialFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const newTestAvatarFileInputRef = useRef<HTMLInputElement>(null);
  const editTestAvatarFileInputRef = useRef<HTMLInputElement>(null);
  const [currentEditingTestIdForUpload, setCurrentEditingTestIdForUpload] = useState<string | null>(null);

  // Sync state when landingPageContent is updated from database/hydration
  useEffect(() => {
    setBrandLogoUrl(landingPageContent.brandLogoUrl || '/barber_clock_logo.jpg');
    setHeroTag(landingPageContent.heroTag);
    setHeroTitle(landingPageContent.heroTitle);
    setHeroSubtitle(landingPageContent.heroSubtitle);
    setHeroCtaText(landingPageContent.heroCtaText);
    setVideoUrl(landingPageContent.videoUrl);
    setVideoTitle(landingPageContent.videoTitle);
    setVideoDescription(landingPageContent.videoDescription);
    setVideoPosterUrl(landingPageContent.videoPosterUrl);
    setGalleryImages([...landingPageContent.galleryImages]);
    setFeatures([...landingPageContent.features]);
    setTestimonials([...landingPageContent.testimonials]);
    setFaqs([...landingPageContent.faqs]);
    setCtaTitle(landingPageContent.ctaTitle);
    setCtaSubtitle(landingPageContent.ctaSubtitle);
    setCtaButtonText(landingPageContent.ctaButtonText);
  }, [landingPageContent]);

  // Process image file from device storage (resizing to max 400x400 for crisp logo & fast persistence)
  const processLogoImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setLogoFeedback({
        type: 'error',
        message: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).',
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setLogoFeedback({
        type: 'error',
        message: 'A imagem deve ter no máximo 8MB.',
      });
      return;
    }

    setIsLoadingLogoFile(true);
    setLogoFeedback(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
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
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            setBrandLogoUrl(optimizedBase64);
            setIsLoadingLogoFile(false);
            setLogoFeedback({
              type: 'success',
              message: 'Nova imagem de perfil carregada do armazenamento com sucesso!',
            });
          } else {
            setBrandLogoUrl(result);
            setIsLoadingLogoFile(false);
          }
        };
        img.onerror = () => {
          setBrandLogoUrl(result);
          setIsLoadingLogoFile(false);
        };
        img.src = result;
      } else {
        setIsLoadingLogoFile(false);
      }
    };
    reader.onerror = () => {
      setIsLoadingLogoFile(false);
      setLogoFeedback({
        type: 'error',
        message: 'Erro ao ler arquivo do dispositivo.',
      });
    };
    reader.readAsDataURL(file);
  };

  // Process avatar image file for testimonials (resizing to max 200x200 for crisp square portrait)
  const processTestimonialAvatarFile = (file: File, isForNew: boolean, targetId?: string) => {
    if (!file.type.startsWith('image/')) {
      setTestimonialFeedback({
        type: 'error',
        message: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).',
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setTestimonialFeedback({
        type: 'error',
        message: 'A foto deve ter no máximo 8MB.',
      });
      return;
    }

    setIsLoadingTestAvatar(true);
    setTestimonialFeedback(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 200;
          let width = img.width;
          let height = img.height;

          // Square crop/fit center
          const size = Math.min(width, height);
          const startX = (width - size) / 2;
          const startY = (height - size) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, startX, startY, size, size, 0, 0, maxDim, maxDim);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            if (isForNew) {
              setNewTestAvatarUrl(optimizedBase64);
            } else if (targetId) {
              setTestimonials((prev) =>
                prev.map((t) => (t.id === targetId ? { ...t, avatarUrl: optimizedBase64 } : t))
              );
            }
            setIsLoadingTestAvatar(false);
            setTestimonialFeedback({
              type: 'success',
              message: 'Foto de perfil do barbeiro processada com sucesso!',
            });
          } else {
            if (isForNew) setNewTestAvatarUrl(result);
            else if (targetId) {
              setTestimonials((prev) =>
                prev.map((t) => (t.id === targetId ? { ...t, avatarUrl: result } : t))
              );
            }
            setIsLoadingTestAvatar(false);
          }
        };
        img.onerror = () => {
          if (isForNew) setNewTestAvatarUrl(result);
          setIsLoadingTestAvatar(false);
        };
        img.src = result;
      } else {
        setIsLoadingTestAvatar(false);
      }
    };
    reader.onerror = () => {
      setIsLoadingTestAvatar(false);
      setTestimonialFeedback({
        type: 'error',
        message: 'Erro ao ler arquivo da foto.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddTestimonial = () => {
    if (!newTestName.trim()) {
      setTestimonialFeedback({
        type: 'error',
        message: 'Por favor, preencha o Nome do Barbeiro.',
      });
      return;
    }
    if (!newTestComment.trim()) {
      setTestimonialFeedback({
        type: 'error',
        message: 'Por favor, insira o texto do depoimento.',
      });
      return;
    }

    const newTest: LandingTestimonial = {
      id: generateId('test'),
      name: newTestName.trim(),
      shopName: newTestShopName.trim() || 'Barbearia Parceira',
      city: newTestCity.trim() || 'Brasil',
      avatarUrl: newTestAvatarUrl.trim() || TESTIMONIAL_AVATAR_PRESETS[0].url,
      comment: newTestComment.trim(),
      rating: Number(newTestRating) || 5,
      revenueGrowth: newTestRevenueGrowth.trim() || undefined,
    };

    setTestimonials((prev) => [newTest, ...prev]);
    setNewTestName('');
    setNewTestShopName('');
    setNewTestCity('');
    setNewTestComment('');
    setNewTestRating(5);
    setNewTestRevenueGrowth('+40% faturamento');
    setTestimonialFeedback({
      type: 'success',
      message: 'Depoimento adicionado com sucesso! Lembre-se de clicar em "Salvar Depoimentos".',
    });
    setActiveTestimonialSubView('list');
  };

  const handleRemoveTestimonial = (id: string) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    setTestimonialFeedback({
      type: 'success',
      message: 'Depoimento removido da lista.',
    });
  };

  const handleMoveTestimonial = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= testimonials.length) return;
    const list = [...testimonials];
    const item = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = item;
    setTestimonials(list);
  };

  const handleResetDefaultTestimonials = () => {
    if (window.confirm('Deseja restaurar os 3 depoimentos recomendados de alta conversão?')) {
      setTestimonials([...DEFAULT_RECOMMENDED_TESTIMONIALS]);
      setTestimonialFeedback({
        type: 'success',
        message: 'Depoimentos restaurados para o padrão recomendado.',
      });
    }
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitizedVideoUrl = parseVideoUrl(videoUrl).embedUrl || videoUrl;

    updateLandingPageContent({
      brandLogoUrl,
      heroTag,
      heroTitle,
      heroSubtitle,
      heroCtaText,
      videoUrl: sanitizedVideoUrl,
      videoTitle,
      videoDescription,
      videoPosterUrl,
      galleryImages,
      features,
      testimonials,
      faqs,
      ctaTitle,
      ctaSubtitle,
      ctaButtonText,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleAddGalleryImage = () => {
    if (!newImageUrl.trim() || !newImageTitle.trim()) return;
    const newImg: LandingGalleryImage = {
      id: generateId('gal'),
      title: newImageTitle.trim(),
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || newImageTitle.trim(),
    };
    setGalleryImages((prev) => [...prev, newImg]);
    setNewImageTitle('');
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const handleRemoveGalleryImage = (id: string) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const newFaq: LandingFaq = {
      id: generateId('faq'),
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
    };
    setFaqs((prev) => [...prev, newFaq]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleRemoveFaq = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6" id="super-admin-landing-editor">
      {/* Top Banner with Preview Button */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Marketing & Captação de Barbearias
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Personalizar Página de Apresentação / Captação
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Edite o vídeo da funcionalidade, textos persuasivos, fotos demonstrativas da interface, depoimentos e perguntas frequentes para atrair e converter novos barbeiros para a plataforma.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('landing_page')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 border border-slate-700"
          >
            <Eye className="w-4 h-4 text-orange-400" />
            Ver Página ao Vivo
          </button>

          {saveSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Salvo!
            </div>
          )}
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'branding', label: 'Logotipo & Perfil', icon: ImageIcon },
          { id: 'video', label: 'Vídeo da Funcionalidade', icon: Video },
          { id: 'texts', label: 'Textos & Títulos (Hero / CTA)', icon: Type },
          { id: 'gallery', label: 'Fotos & Demonstrações', icon: Layers },
          { id: 'features', label: 'Diferenciais & Recursos', icon: Sparkles },
          { id: 'testimonials', label: 'Depoimentos de Barbeiros', icon: MessageSquare },
          { id: 'faqs', label: 'Perguntas Frequentes (FAQ)', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Editor Content Box */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* 0. Branding Section (Logo & Profile Image from Storage) */}
        {activeSection === 'branding' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                Logotipo & Imagem de Perfil da Página de Apresentação
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Altere a imagem principal exibida no topo do cabeçalho da página de apresentação e no rodapé.
              </p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    Imagem Atual do Logotipo / Perfil
                  </span>
                  <span className="text-xs text-slate-500">
                    A imagem é otimizada automaticamente para carregamento ultrarrápido em qualquer dispositivo.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBrandLogoUrl('/barber_clock_logo.jpg');
                    setLogoFeedback({
                      type: 'success',
                      message: 'Restaurado para o logotipo padrão.',
                    });
                  }}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5 transition px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                {/* Visual Preview */}
                <div className="relative group shrink-0">
                  <img
                    src={brandLogoUrl || '/barber_clock_logo.jpg'}
                    alt="Logo Preview"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-amber-500/90 shadow-xl bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white text-xs font-bold"
                    title="Trocar Foto"
                  >
                    <Upload className="w-6 h-6" />
                    <span>Trocar</span>
                  </button>
                </div>

                {/* Upload & Storage Area */}
                <div className="flex-1 w-full space-y-3">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processLogoImageFile(file);
                    }}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processLogoImageFile(file);
                    }}
                    onClick={() => logoFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isDraggingLogo
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm block">
                        Buscar Imagem no Armazenamento do Dispositivo
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Clique para selecionar arquivo do seu computador/celular ou arraste aqui (PNG, JPG, WEBP)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 underline"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {showLogoUrlInput ? 'Ocultar campo de link da web' : 'Ou inserir link da web (URL)'}
                    </button>

                    {isLoadingLogoFile && (
                      <span className="text-xs text-amber-500 font-semibold flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Lendo e redimensionando imagem...
                      </span>
                    )}
                  </div>

                  {showLogoUrlInput && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="url"
                        placeholder="https://exemplo.com/logotipo.png"
                        value={customLogoUrl}
                        onChange={(e) => setCustomLogoUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customLogoUrl.trim()) {
                            setBrandLogoUrl(customLogoUrl.trim());
                            setCustomLogoUrl('');
                            setShowLogoUrlInput(false);
                            setLogoFeedback({
                              type: 'success',
                              message: 'Link da imagem aplicado com sucesso!',
                            });
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Aplicar URL
                      </button>
                    </div>
                  )}

                  {logoFeedback && (
                    <div
                      className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
                        logoFeedback.type === 'success'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300'
                      }`}
                    >
                      {logoFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span>{logoFeedback.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Imagem de Perfil & Logotipo
              </button>
            </div>
          </div>
        )}

        {/* 1. Video Section */}
        {activeSection === 'video' && (() => {
          const parsedVideo = parseVideoUrl(videoUrl);

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-orange-500" />
                  Vídeo Demonstrativo da Funcionalidade
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Insira qualquer link do YouTube (link comum de exibição, link curto, shorts, incorporação ou iframe), Vimeo ou MP4 direto. O sistema converte e corrige automaticamente para evitar erros de conexão.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Link ou Código do Vídeo *
                      </label>
                      {parsedVideo.isValid && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          {parsedVideo.providerName} Detectado {parsedVideo.videoId ? `(ID: ${parsedVideo.videoId})` : ''}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />

                    {/* Status & Auto-format helpers */}
                    <div className="mt-2 space-y-1.5">
                      {parsedVideo.type === 'youtube' && (
                        <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-orange-800 dark:text-orange-300">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="text-[11px] font-medium">Link do YouTube normalizado automaticamente para incorporação segura (sem erro de conexão).</span>
                          </div>
                          {parsedVideo.thumbnailUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (parsedVideo.thumbnailUrl) {
                                  setVideoPosterUrl(parsedVideo.thumbnailUrl);
                                }
                              }}
                              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                              Usar capa do YouTube
                            </button>
                          )}
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400">
                        <strong>Formatos suportados:</strong> <code className="text-slate-600 dark:text-slate-300">youtube.com/watch?v=...</code>, <code className="text-slate-600 dark:text-slate-300">youtu.be/...</code>, <code className="text-slate-600 dark:text-slate-300">youtube.com/shorts/...</code>, código de iframe ou links diretos.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Título da Seção do Vídeo
                    </label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição do Vídeo
                    </label>
                    <textarea
                      rows={3}
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      URL da Imagem de Capa (Poster)
                    </label>
                    <input
                      type="text"
                      value={videoPosterUrl}
                      onChange={(e) => setVideoPosterUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Video Preview Box */}
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-orange-500" />
                    Pré-visualização do Player na Landing Page
                  </span>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-lg relative flex items-center justify-center">
                    {parsedVideo.isValid && (parsedVideo.type === 'youtube' || parsedVideo.type === 'vimeo' || parsedVideo.type === 'other') ? (
                      <iframe
                        key={parsedVideo.embedUrl}
                        src={parsedVideo.embedUrl}
                        title="Demonstração do Sistema"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : parsedVideo.isValid && parsedVideo.type === 'direct' ? (
                      <video
                        key={parsedVideo.embedUrl}
                        src={parsedVideo.embedUrl}
                        poster={videoPosterUrl || parsedVideo.thumbnailUrl}
                        controls
                        className="w-full h-full object-cover"
                        playsInline
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={videoPosterUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'}
                          alt="Poster"
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                          <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center shadow-xl mb-2">
                            <Play className="w-6 h-6 ml-0.5" />
                          </div>
                          <span className="font-bold text-xs">{videoTitle}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2. Texts Section */}
        {activeSection === 'texts' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Type className="w-5 h-5 text-orange-500" />
                Textos de Impacto & Chamadas para Ação (Hero & CTA)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize a mensagem principal da landing page para maximizar a conversão de novos barbeiros.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tag de Destaque Superior (Hero Badge)
                </label>
                <input
                  type="text"
                  value={heroTag}
                  onChange={(e) => setHeroTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título Principal da Página (Hero Headline) *
                </label>
                <input
                  type="text"
                  required
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-orange-600 dark:text-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtítulo Explicativo (Hero Subtitle) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Texto do Botão Principal da Hero
                  </label>
                  <input
                    type="text"
                    value={heroCtaText}
                    onChange={(e) => setHeroCtaText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Texto do Botão da Seção Final de Chamada
                  </label>
                  <input
                    type="text"
                    value={ctaButtonText}
                    onChange={(e) => setCtaButtonText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Chamada de Ação Final (Rodapé da Página)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Título da Chamada Final
                    </label>
                    <input
                      type="text"
                      value={ctaTitle}
                      onChange={(e) => setCtaTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Subtítulo da Chamada Final
                    </label>
                    <input
                      type="text"
                      value={ctaSubtitle}
                      onChange={(e) => setCtaSubtitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Gallery Section */}
        {activeSection === 'gallery' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                Fotos & Demonstrações Visuais da Interface
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Exiba capturas e fotos das funcionalidades para inspirar confiança nos barbeiros.
              </p>
            </div>

            {/* List of existing gallery images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 relative group"
                >
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {img.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {img.caption}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(img.id)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-80 hover:opacity-100 transition shadow-sm"
                    title="Remover foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Gallery Image */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-3">
              <span className="text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Adicionar Nova Foto na Galeria
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Título da Imagem
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Painel do Barbeiro"
                    value={newImageTitle}
                    onChange={(e) => setNewImageTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    URL da Imagem *
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Legenda / Explicação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Gráficos de faturamento diário..."
                    value={newImageCaption}
                    onChange={(e) => setNewImageCaption(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Inserir Foto na Galeria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Features Section */}
        {activeSection === 'features' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Diferenciais & Vantagens para os Barbeiros
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Personalize os cards de benefícios exibidos na landing page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feat, index) => (
                <div
                  key={feat.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Título do Diferencial #{index + 1}
                    </label>
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setFeatures((prev) =>
                          prev.map((f) =>
                            f.id === feat.id ? { ...f, title: newTitle } : f
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Descrição da Vantagem
                    </label>
                    <textarea
                      rows={2}
                      value={feat.description}
                      onChange={(e) => {
                        const newDesc = e.target.value;
                        setFeatures((prev) =>
                          prev.map((f) =>
                            f.id === feat.id ? { ...f, description: newDesc } : f
                          )
                        );
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Testimonials Section (Full CRUD: Add, Edit, Delete, Reorder, File Upload, Presets, Preview) */}
        {activeSection === 'testimonials' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            {/* Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  Depoimentos Reais de Barbeiros Parceiros
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gerencie, adicione, edite ou exclua os depoimentos de barbeiros parceiros com fotos e métricas de sucesso.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultTestimonials}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
                  title="Restaurar depoimentos padrão recomendados"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restaurar Padrão</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTestimonialSubView('add')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Depoimento</span>
                </button>
              </div>
            </div>

            {/* Hidden file inputs for avatar uploads */}
            <input
              type="file"
              ref={newTestAvatarFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processTestimonialAvatarFile(file, true);
              }}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <input
              type="file"
              ref={editTestAvatarFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && currentEditingTestIdForUpload) {
                  processTestimonialAvatarFile(file, false, currentEditingTestIdForUpload);
                }
              }}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            {/* Feedback notification */}
            {testimonialFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
                  testimonialFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testimonialFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testimonialFeedback.message}</span>
              </div>
            )}

            {/* Sub-tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTestimonialSubView('list')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTestimonialSubView === 'list'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Depoimentos Cadastrados ({testimonials.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTestimonialSubView('add')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTestimonialSubView === 'add'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Novo
              </button>

              <button
                type="button"
                onClick={() => setActiveTestimonialSubView('preview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTestimonialSubView === 'preview'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Prévia na Landing Page
              </button>
            </div>

            {/* Sub-view 1: ADD NEW TESTIMONIAL FORM */}
            {activeTestimonialSubView === 'add' && (
              <div className="p-6 bg-orange-50/50 dark:bg-slate-800/60 rounded-3xl border border-orange-200 dark:border-orange-900/60 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Cadastrar Novo Depoimento de Barbeiro
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Preencha as informações do profissional para inspirar novos credenciamentos.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTestimonialSubView('list')}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                  >
                    Voltar para Lista
                  </button>
                </div>

                {/* Avatar Selection & Upload */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Foto de Perfil do Barbeiro
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual Preview */}
                    <div className="relative group shrink-0">
                      <img
                        src={newTestAvatarUrl || TESTIMONIAL_AVATAR_PRESETS[0].url}
                        alt="Avatar Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-md bg-slate-900"
                      />
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => newTestAvatarFileInputRef.current?.click()}
                          disabled={isLoadingTestAvatar}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 hover:text-orange-600 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isLoadingTestAvatar ? 'Processando foto...' : 'Escolher Foto do Computador/Celular'}
                        </button>

                        <span className="text-[11px] text-slate-400">ou selecione um avatar rápido:</span>
                      </div>

                      {/* Presets Grid */}
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {TESTIMONIAL_AVATAR_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setNewTestAvatarUrl(preset.url)}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition shrink-0 ${
                              newTestAvatarUrl === preset.url
                                ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105'
                                : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>

                      {/* URL input */}
                      <input
                        type="url"
                        placeholder="Ou cole o link direto da imagem (https://...)"
                        value={newTestAvatarUrl}
                        onChange={(e) => setNewTestAvatarUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nome do Barbeiro *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Oliveira"
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nome da Barbearia
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Barbearia Don Corleone"
                      value={newTestShopName}
                      onChange={(e) => setNewTestShopName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Cidade - Estado (UF)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Belo Horizonte - MG"
                      value={newTestCity}
                      onChange={(e) => setNewTestCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Métrica de Destaque
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +50% faturamento / Zero faltas"
                      value={newTestRevenueGrowth}
                      onChange={(e) => setNewTestRevenueGrowth(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Rating selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Avaliação em Estrelas
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewTestRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newTestRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                      {newTestRating} de 5 estrelas
                    </span>
                  </div>
                </div>

                {/* Comment textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Texto do Depoimento *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Conte como o sistema ajudou no dia a dia, reduziu faltas, acelerou agendamentos e aumentou os ganhos da barbearia..."
                    value={newTestComment}
                    onChange={(e) => setNewTestComment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTestimonialSubView('list')}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTestimonial}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Inserir Depoimento na Lista
                  </button>
                </div>
              </div>
            )}

            {/* Sub-view 2: TESTIMONIALS LIST (EDIT / DELETE / REORDER) */}
            {activeTestimonialSubView === 'list' && (
              <div className="space-y-4">
                {testimonials.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                    <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Nenhum depoimento cadastrado
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Depoimentos com fotos reais e métricas de faturamento geram forte credibilidade para novos barbeiros se cadastrarem.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTestimonialSubView('add')}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Primeiro Depoimento
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDefaultTestimonials}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                      >
                        Restaurar Depoimentos Recomendados
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map((test, idx) => (
                      <div
                        key={test.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 relative group"
                      >
                        {/* Top action bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <img
                                src={test.avatarUrl || TESTIMONIAL_AVATAR_PRESETS[0].url}
                                alt={test.name}
                                className="w-8 h-8 rounded-full object-cover border border-orange-500"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                                  {test.name || 'Barbeiro Sem Nome'}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {test.shopName || 'Barbearia'} • {test.city || 'Brasil'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveTestimonial(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 rounded-lg transition"
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveTestimonial(idx, 'down')}
                              disabled={idx === testimonials.length - 1}
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 rounded-lg transition"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Testimonial */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Deseja realmente excluir o depoimento de "${test.name}"?`)) {
                                  handleRemoveTestimonial(test.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition ml-1"
                              title="Excluir Depoimento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Edit Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <User className="w-3 h-3 text-orange-500" />
                              Nome do Barbeiro
                            </label>
                            <input
                              type="text"
                              value={test.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestimonials((prev) =>
                                  prev.map((t) => (t.id === test.id ? { ...t, name: val } : t))
                                );
                              }}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-orange-500" />
                              Nome da Barbearia
                            </label>
                            <input
                              type="text"
                              value={test.shopName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestimonials((prev) =>
                                  prev.map((t) => (t.id === test.id ? { ...t, shopName: val } : t))
                                );
                              }}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-orange-500" />
                              Cidade - UF
                            </label>
                            <input
                              type="text"
                              value={test.city}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestimonials((prev) =>
                                  prev.map((t) => (t.id === test.id ? { ...t, city: val } : t))
                                );
                              }}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                              Métrica de Destaque
                            </label>
                            <input
                              type="text"
                              value={test.revenueGrowth || ''}
                              placeholder="ex: +40% faturamento"
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestimonials((prev) =>
                                  prev.map((t) => (t.id === test.id ? { ...t, revenueGrowth: val } : t))
                                );
                              }}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400"
                            />
                          </div>
                        </div>

                        {/* Avatar & Rating row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          {/* Avatar editing with upload button and presets */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Foto de Perfil (URL ou Trocar Foto)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={test.avatarUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTestimonials((prev) =>
                                    prev.map((t) => (t.id === test.id ? { ...t, avatarUrl: val } : t))
                                  );
                                }}
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentEditingTestIdForUpload(test.id);
                                  editTestAvatarFileInputRef.current?.click();
                                }}
                                className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-orange-500 hover:text-white rounded-xl text-[11px] font-bold transition shrink-0"
                                title="Carregar foto do dispositivo"
                              >
                                Trocar Foto
                              </button>
                            </div>
                          </div>

                          {/* Star rating selector */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Avaliação do Barbeiro
                            </label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setTestimonials((prev) =>
                                      prev.map((t) => (t.id === test.id ? { ...t, rating: star } : t))
                                    );
                                  }}
                                  className="p-1 hover:scale-110 transition"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= (test.rating || 5)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5">
                                {test.rating || 5}/5 estrelas
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Comment textarea */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Quote className="w-3 h-3 text-orange-500" />
                            Depoimento / Comentário
                          </label>
                          <textarea
                            rows={2}
                            value={test.comment}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTestimonials((prev) =>
                                prev.map((t) => (t.id === test.id ? { ...t, comment: val } : t))
                              );
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-view 3: LIVE PREVIEW OF TESTIMONIAL CARDS */}
            {activeTestimonialSubView === 'preview' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                  <div className="text-center max-w-xl mx-auto py-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-2">
                      <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                      Histórias Reais de Sucesso
                    </div>
                    <h4 className="text-xl font-black text-white">
                      Como os cartões são exibidos na Landing Page
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {testimonials.map((test) => (
                      <div
                        key={test.id}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex text-amber-400 gap-0.5">
                              {Array.from({ length: test.rating || 5 }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                              ))}
                            </div>
                            {test.revenueGrowth && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {test.revenueGrowth}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 italic leading-relaxed mb-4">
                            "{test.comment}"
                          </p>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                          <img
                            src={test.avatarUrl || TESTIMONIAL_AVATAR_PRESETS[0].url}
                            alt={test.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-orange-500 shrink-0"
                          />
                          <div>
                            <h5 className="font-bold text-xs text-white">{test.name}</h5>
                            <span className="text-[10px] text-slate-400 block">
                              {test.shopName} • {test.city}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Testimonials Quick Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {testimonials.length} depoimento(s) configurado(s).
              </span>
              <button
                type="button"
                onClick={() => handleSaveAll()}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Depoimentos
              </button>
            </div>
          </div>
        )}

        {/* 6. FAQs Section */}
        {activeSection === 'faqs' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                Perguntas Frequentes (FAQ)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tire as principais dúvidas de quem quer credenciar uma barbearia na plataforma.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      Pergunta #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(faq.id)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Excluir pergunta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFaqs((prev) =>
                        prev.map((f) => (f.id === faq.id ? { ...f, question: val } : f))
                      );
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFaqs((prev) =>
                        prev.map((f) => (f.id === faq.id ? { ...f, answer: val } : f))
                      );
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Add New FAQ */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-3">
              <span className="text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Adicionar Nova Pergunta Frequente
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Pergunta (ex: Preciso de CNPJ para me cadastrar?)"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />

                <textarea
                  rows={2}
                  placeholder="Resposta clara e objetiva..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Inserir Pergunta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Todas as alterações são salvas e publicadas em tempo real na plataforma.
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações da Página
          </button>
        </div>
      </form>
    </div>
  );
};

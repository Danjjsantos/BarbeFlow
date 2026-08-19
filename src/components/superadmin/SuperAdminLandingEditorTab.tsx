import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LandingPageContent,
  LandingGalleryImage,
  LandingFeature,
  LandingTestimonial,
  LandingFaq,
} from '../../types';
import { generateId } from '../../utils/formatters';
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
} from 'lucide-react';

export const SuperAdminLandingEditorTab: React.FC = () => {
  const { landingPageContent, updateLandingPageContent, setCurrentView } = useApp();

  const [activeSection, setActiveSection] = useState<
    'video' | 'texts' | 'gallery' | 'features' | 'testimonials' | 'faqs'
  >('video');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state initialized with landingPageContent
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

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateLandingPageContent({
      heroTag,
      heroTitle,
      heroSubtitle,
      heroCtaText,
      videoUrl,
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
    setTimeout(() => setSaveSuccess(false), 3000);
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
          { id: 'video', label: 'Vídeo da Funcionalidade', icon: Video },
          { id: 'texts', label: 'Textos & Títulos (Hero / CTA)', icon: Type },
          { id: 'gallery', label: 'Fotos & Demonstrações', icon: ImageIcon },
          { id: 'features', label: 'Diferenciais & Recursos', icon: Layers },
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
        {/* 1. Video Section */}
        {activeSection === 'video' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-orange-500" />
                Vídeo Demonstrativo da Funcionalidade
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Insira o link do vídeo demonstrando o agendamento do cliente, confirmação no PIX e painel do barbeiro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL do Vídeo (YouTube Embed ou MP4) *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dica: No YouTube, clique em "Compartilhar" &gt; "Incorporar" e copie o link do iframe.
                  </p>
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
                  {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={videoUrl}
                      title="Demonstração do Sistema"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
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
        )}

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

        {/* 5. Testimonials Section */}
        {activeSection === 'testimonials' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Depoimentos Reais de Barbeiros Parceiros
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Depoimentos com prova social aumentam drasticamente a confiança dos novos barbeiros.
              </p>
            </div>

            <div className="space-y-4">
              {testimonials.map((test, idx) => (
                <div
                  key={test.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
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
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nome da Barbearia & Cidade
                      </label>
                      <input
                        type="text"
                        value={`${test.shopName} (${test.city})`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTestimonials((prev) =>
                            prev.map((t) => (t.id === test.id ? { ...t, shopName: val } : t))
                          );
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Métrica de Resultado (ex: +40% faturamento)
                      </label>
                      <input
                        type="text"
                        value={test.revenueGrowth || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTestimonials((prev) =>
                            prev.map((t) =>
                              t.id === test.id ? { ...t, revenueGrowth: val } : t
                            )
                          );
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
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

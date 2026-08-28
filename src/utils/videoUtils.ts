/**
 * Video URL Normalizer and Embed Resolver
 * Solves "Connection Refused" (X-Frame-Options: SAMEORIGIN) by converting standard
 * YouTube/Vimeo URLs into valid, secure embed iframe endpoints.
 */

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'other' | 'empty';
  videoId?: string;
  embedUrl: string;
  originalUrl: string;
  thumbnailUrl?: string;
  isValid: boolean;
  providerName: string;
}

/**
 * Extracts start time in seconds from time parameters (e.g. 1m30s, 90, 90s)
 */
function parseStartTime(timeParam: string | null): number | null {
  if (!timeParam) return null;
  const raw = timeParam.trim();
  
  // If it's pure digits
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }
  
  // If format is like 1h2m30s or 2m15s or 45s
  let seconds = 0;
  const hoursMatch = raw.match(/(\d+)h/i);
  const minutesMatch = raw.match(/(\d+)m/i);
  const secondsMatch = raw.match(/(\d+)s/i);

  if (hoursMatch) seconds += parseInt(hoursMatch[1], 10) * 3600;
  if (minutesMatch) seconds += parseInt(minutesMatch[1], 10) * 60;
  if (secondsMatch) seconds += parseInt(secondsMatch[1], 10);

  return seconds > 0 ? seconds : null;
}

/**
 * Parses any video URL or iframe snippet and extracts normalized embed information.
 */
export function parseVideoUrl(input: string | undefined | null): VideoInfo {
  if (!input || typeof input !== 'string') {
    return {
      type: 'empty',
      embedUrl: '',
      originalUrl: '',
      isValid: false,
      providerName: 'Nenhum',
    };
  }

  let cleaned = input.trim();

  // 1. If user pasted a complete <iframe> embed code, extract the src attribute
  if (cleaned.toLowerCase().includes('<iframe') || cleaned.toLowerCase().includes('src=')) {
    const srcMatch = cleaned.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      cleaned = srcMatch[1].trim();
    }
  }

  // Remove surrounding quotes if any
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  if (!cleaned) {
    return {
      type: 'empty',
      embedUrl: '',
      originalUrl: input,
      isValid: false,
      providerName: 'Vazio',
    };
  }

  // 2. Check if input is a direct 11-character YouTube Video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
    const videoId = cleaned;
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
      originalUrl: input,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      isValid: true,
      providerName: 'YouTube',
    };
  }

  // 3. Detect YouTube variations
  // Patterns:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/watch?v=VIDEO_ID&t=10s
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  const isYouTube =
    cleaned.includes('youtube.com') ||
    cleaned.includes('youtu.be') ||
    cleaned.includes('youtube-nocookie.com');

  if (isYouTube) {
    let videoId: string | null = null;
    let startTime: number | null = null;

    try {
      // Handle youtu.be/VIDEO_ID
      const youtuBeMatch = cleaned.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
      if (youtuBeMatch && youtuBeMatch[1]) {
        videoId = youtuBeMatch[1];
      }

      // Handle youtube.com/shorts/VIDEO_ID
      if (!videoId) {
        const shortsMatch = cleaned.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
        if (shortsMatch && shortsMatch[1]) {
          videoId = shortsMatch[1];
        }
      }

      // Handle youtube.com/live/VIDEO_ID
      if (!videoId) {
        const liveMatch = cleaned.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
        if (liveMatch && liveMatch[1]) {
          videoId = liveMatch[1];
        }
      }

      // Handle youtube.com/embed/VIDEO_ID
      if (!videoId) {
        const embedMatch = cleaned.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
        if (embedMatch && embedMatch[1]) {
          videoId = embedMatch[1];
        }
      }

      // Handle standard /watch?v=VIDEO_ID
      if (!videoId) {
        const watchMatch = cleaned.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
        if (watchMatch && watchMatch[1]) {
          videoId = watchMatch[1];
        }
      }

      // Handle /v/VIDEO_ID
      if (!videoId) {
        const vMatch = cleaned.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i);
        if (vMatch && vMatch[1]) {
          videoId = vMatch[1];
        }
      }

      // Extract timestamp (t=... or start=...)
      const timeMatch = cleaned.match(/[?&](?:t|start)=([^&#]+)/i);
      if (timeMatch && timeMatch[1]) {
        startTime = parseStartTime(timeMatch[1]);
      }
    } catch {
      // Fallback regex scan for 11 char ID if URL parsing threw
      const genericMatch = cleaned.match(/(?:[=/]|v=)([a-zA-Z0-9_-]{11})/i);
      if (genericMatch && genericMatch[1]) {
        videoId = genericMatch[1];
      }
    }

    if (videoId) {
      let embed = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
      if (startTime !== null) {
        embed += `&start=${startTime}`;
      }
      return {
        type: 'youtube',
        videoId,
        embedUrl: embed,
        originalUrl: input,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        isValid: true,
        providerName: 'YouTube',
      };
    }
  }

  // 4. Detect Vimeo
  // Patterns: vimeo.com/123456789, player.vimeo.com/video/123456789
  const isVimeo = cleaned.includes('vimeo.com');
  if (isVimeo) {
    const vimeoMatch = cleaned.match(/vimeo(?:\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)|.*?\/(\d+))/i);
    const vimeoId = vimeoMatch ? (vimeoMatch[1] || vimeoMatch[2]) : null;

    if (vimeoId) {
      return {
        type: 'vimeo',
        videoId: vimeoId,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479`,
        originalUrl: input,
        isValid: true,
        providerName: 'Vimeo',
      };
    }
  }

  // 5. Detect Direct Video Files (.mp4, .webm, .ogg, .mov, etc.)
  const directVideoExtensions = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;
  if (directVideoExtensions.test(cleaned)) {
    return {
      type: 'direct',
      embedUrl: cleaned,
      originalUrl: input,
      isValid: true,
      providerName: 'Vídeo Direto (MP4/WebM)',
    };
  }

  // 6. Generic embed URL (if already http/https link)
  if (/^https?:\/\//i.test(cleaned)) {
    return {
      type: 'other',
      embedUrl: cleaned,
      originalUrl: input,
      isValid: true,
      providerName: 'Link Web',
    };
  }

  return {
    type: 'other',
    embedUrl: cleaned,
    originalUrl: input,
    isValid: false,
    providerName: 'Desconhecido',
  };
}

/**
 * Returns a guaranteed embed-safe URL or empty string
 */
export function getSafeEmbedUrl(url: string | undefined | null): string {
  const parsed = parseVideoUrl(url);
  return parsed.embedUrl || (url || '');
}

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Link as LinkIcon,
  Sparkles,
  Clipboard,
  XCircle,
  Sliders,
  Languages,
  Film,
  AlertCircle,
  HardDrive,
  Upload,
  Play,
  Loader2,
  ChevronDown
} from "lucide-react";
import { OutputStyleSelector, type OutputStyle } from "../OutputStyleSelector";
import { ToggleSwitch } from "../ToggleSwitch";
import { DEFAULT_SUBTITLE_CONFIG, type SubtitleConfig } from "../../types/subtitle";
import { DEFAULT_CANVAS_CONFIG, type CanvasConfig } from "../../types/canvas";
import type { CreateJobPayload } from "../../types/job";
import { GDriveBrowserModal } from "../GDriveBrowserModal";
import { apiUploadVideo } from "../../api";
import { CanvasConfigControls } from "../ui/CanvasConfigControls";
import { SubtitleConfigControls } from "../ui/SubtitleConfigControls";

export interface HeroInputProps {
  initialUrl?: string;
  isSubmitting?: boolean;
  onSubmit: (payload: CreateJobPayload) => void;
}

const STORAGE_DRAFT_INPUT = "ac_draft_hero_input";

const SUPPORTED_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "instagram.com",
  "twitter.com",
  "x.com",
];

export const HeroInput: React.FC<HeroInputProps> = ({
  initialUrl = "",
  isSubmitting = false,
  onSubmit,
}) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [title, setTitle] = useState<string>("");
  const [outputStyle, setOutputStyle] = useState<OutputStyle>("face_crop");
  
  const [whisperModel, setWhisperModel] = useState<string>("small");
  const [language, setLanguage] = useState<string>("auto");
  const [maxClips, setMaxClips] = useState<number>(0);
  const [clipsOpen, setClipsOpen] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>("");
  const [clipFormat, setClipFormat] = useState<string>("general");
  const [aiSelectClips, setAiSelectClips] = useState<boolean>(true);
  const [quality, setQuality] = useState<"720p" | "1080p">("1080p");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(true);
  const [enableHook, setEnableHook] = useState<boolean>(false);

  const [isGamingVideo, setIsGamingVideo] = useState<boolean>(false);

  // New Structured Configs
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(DEFAULT_CANVAS_CONFIG);
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    ...DEFAULT_SUBTITLE_CONFIG,
    style: "viral_pop" as any, // Set default
  });

  const [trackingMode, setTrackingMode] = useState<"auto" | "center">("auto");
  const [faceTrackingEngine, setFaceTrackingEngine] = useState<"haar" | "mediapipe">("mediapipe");

  const [urlError, setUrlError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clipsRef = useRef<HTMLDivElement>(null);

  const handlePickFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUrlError(null);
    try {
      const localUrl = await apiUploadVideo(file);
      setUrl(localUrl);
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (err: any) {
      setUrlError(`Upload gagal: ${err?.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  // Load drafts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_INPUT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && !initialUrl) setUrl(parsed.url);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.outputStyle) setOutputStyle(parsed.outputStyle);
        if (parsed.whisperModel) setWhisperModel(parsed.whisperModel);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.maxClips !== undefined) setMaxClips(parsed.maxClips);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.clipFormat) setClipFormat(parsed.clipFormat);
        if (parsed.aiSelectClips !== undefined) setAiSelectClips(parsed.aiSelectClips);
        if (parsed.quality) setQuality(parsed.quality);
        if (parsed.burnSubtitles !== undefined) setBurnSubtitles(parsed.burnSubtitles);
        if (parsed.enableHook !== undefined) setEnableHook(parsed.enableHook);
        if (parsed.isGamingVideo !== undefined) setIsGamingVideo(parsed.isGamingVideo);
        if (parsed.canvasConfig) setCanvasConfig(parsed.canvasConfig);
        if (parsed.subtitleConfig) setSubtitleConfig(parsed.subtitleConfig);
        if (parsed.trackingMode) setTrackingMode(parsed.trackingMode);
        if (parsed.faceTrackingEngine) setFaceTrackingEngine(parsed.faceTrackingEngine);
      }
    } catch {
      // Ignore
    }
  }, [initialUrl]);

  // Sync canvas config enabled state with output style
  useEffect(() => {
    if (outputStyle === "canvas_blur") {
      setCanvasConfig(prev => ({ ...prev, enabled: true }));
    } else {
      setCanvasConfig(prev => ({ ...prev, enabled: false }));
    }
  }, [outputStyle]);

  // Save drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_DRAFT_INPUT,
        JSON.stringify({
          url,
          title,
          outputStyle,
          whisperModel,
          language,
          maxClips,
          topic,
          clipFormat,
          aiSelectClips,
          quality,
          burnSubtitles,
          enableHook,
          isGamingVideo,
          canvasConfig,
          subtitleConfig,
          trackingMode,
          faceTrackingEngine,
        })
      );
    } catch {
      // Ignore
    }
  }, [url, title, outputStyle, whisperModel, language, maxClips, topic, clipFormat, aiSelectClips, quality, burnSubtitles, enableHook, isGamingVideo, canvasConfig, subtitleConfig, trackingMode, faceTrackingEngine]);

  // Close max-clips popover on outside click / Escape
  useEffect(() => {
    if (!clipsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!clipsRef.current?.contains(e.target as Node)) setClipsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClipsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [clipsOpen]);

  const validateUrl = (testUrl: string): boolean => {
    const clean = testUrl.trim();
    if (!clean) {
      setUrlError("Video URL is required");
      return false;
    }
    if (clean.startsWith("local:")) {
      setUrlError(null);
      return true;
    }
    const isSupported = SUPPORTED_DOMAINS.some((domain) =>
      clean.toLowerCase().includes(domain)
    );
    if (!isSupported && !clean.startsWith("http://") && !clean.startsWith("https://")) {
      setUrlError("Please enter a valid YouTube, TikTok, Instagram, or X/Twitter URL");
      return false;
    }
    setUrlError(null);
    return true;
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        validateUrl(text.trim());
      }
    } catch (err) {
      console.warn("Could not access clipboard", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) return;

    // Aspect ratio
    let aspectRatio = "9:16";
    if (outputStyle === "landscape" || (!canvasConfig.enabled && outputStyle === "canvas_blur")) aspectRatio = "16:9";
    if (outputStyle === "square") aspectRatio = "1:1";

    const payload: CreateJobPayload = {
      url: url.trim(),
      provider: "manual",
      title: title.trim() || `Auto Clip - ${new Date().toLocaleTimeString()}`,
      aspect_ratio: aspectRatio,
      caption_style: subtitleConfig.style,
      burn_subs: burnSubtitles,
      enable_hook: enableHook,
      // Gaming/Gadget formats need the split-screen framing, so they turn the
      // gaming flag on by themselves (the toggle stays as a manual override).
      is_gaming_video: isGamingVideo || clipFormat === "gaming" || clipFormat === "gadget",
      quality,
      whisper_model: whisperModel,
      language: language === "auto" ? "" : language,
      max_clips: maxClips,
      topic: topic.trim(),
      clip_format: clipFormat,
      ai_select_clips: aiSelectClips,
      canvas_config: canvasConfig,
      subtitle_config: subtitleConfig,
      tracking_mode: trackingMode,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="ac-form w-full max-w-full min-w-0">
      {/* Video URL Input Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="video-url" className="ac-section-title flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Source Video</span>
            <span className="text-[10px] font-normal text-emerald-600">*wajib</span>
          </label>
          <span className="text-[10px] text-text-tertiary truncate">
            YouTube · TikTok · Reels · X
          </span>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <input
            id="video-url"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) validateUrl(e.target.value);
            }}
            placeholder="Paste URL atau browse Google Drive..."
            required
            className={`w-full min-w-0 sm:flex-1 px-3 py-2 bg-bg-surface/50 border rounded-lg text-text-primary placeholder:text-text-tertiary text-xs focus:outline-none focus:bg-white focus:ring-2 transition-all font-mono ${
              urlError
                ? "border-red-500/80 focus:ring-red-500/30"
                : "border-border focus:border-emerald-500 focus:ring-emerald-500/20"
            }`}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                handlePickFile(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="ac-url-btn flex-1 sm:flex-none"
              title="Upload video dari PC"
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              <span>Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBrowserOpen(true)}
              className="ac-url-btn flex-1 sm:flex-none"
              title="Browse Google Drive"
            >
              <HardDrive />
              <span>Drive</span>
            </button>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="ac-url-btn flex-1 sm:flex-none"
              title="Paste dari clipboard"
            >
              <Clipboard />
              <span>Paste</span>
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="ac-url-btn"
                title="Clear input"
                style={{ padding: "8px" }}
              >
                <XCircle />
              </button>
            )}
          </div>
        </div>

        <GDriveBrowserModal
          isOpen={isBrowserOpen}
          onClose={() => setIsBrowserOpen(false)}
          onSelectFile={(filePath) => {
            const newUrl = `local:${filePath}`;
            setUrl(newUrl);
            validateUrl(newUrl);
            setIsBrowserOpen(false);
          }}
        />

        {urlError && (
          <div className="flex items-center gap-2 text-xs text-red-500 mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{urlError}</span>
          </div>
        )}
      </div>

      {/* AI Clip Selection + Topic / Format */}
      <div className="ac-section">
        <div className="ac-toggle-row" style={{ borderTop: 0 }}>
          <div className="ac-toggle-text">
            <span className="ac-toggle-title">AI Pilih Klip Terbaik</span>
            <span className="ac-toggle-sub">
              {aiSelectClips
                ? "AI memilih momen terbaik dari transkrip."
                : "Tanpa AI: video dirender utuh sebagai 1 klip."}
            </span>
          </div>
          <ToggleSwitch checked={aiSelectClips} onChange={setAiSelectClips} disabled={isSubmitting} />
        </div>

        {aiSelectClips && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="clip-topic" className="text-[11px] font-medium text-text-secondary">
                Topik Klip (opsional)
              </label>
              <input
                id="clip-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isSubmitting}
                placeholder="mis. kesehatan, gadget, film"
                className="w-full px-2.5 py-1.5 bg-bg-surface/50 border border-border rounded-lg text-text-primary placeholder:text-text-tertiary text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="clip-format" className="text-[11px] font-medium text-text-secondary">
                Format Klip
              </label>
              <select
                id="clip-format"
                value={clipFormat}
                onChange={(e) => setClipFormat(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 bg-bg-surface/50 border border-border rounded-lg text-text-primary text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="general">General / Podcast</option>
                <option value="review">Review (umum)</option>
                <option value="gadget">Review Gadget</option>
                <option value="film">Review Film / Series</option>
                <option value="gaming">Gaming</option>
              </select>
            </div>
          </div>
        )}
      </div>


      {/* Output Style Selector */}
      <div className="pt-1">
        <OutputStyleSelector
          value={outputStyle}
          onChange={(val) => setOutputStyle(val)}
          disabled={isSubmitting}
        />
      </div>

      {/* Tracking Mode Options for Portrait */}
      {["face_crop", "canvas_blur", "square"].includes(outputStyle) && (
        <>
          <div className="ac-section">
            <span className="ac-section-title">Face Tracking</span>
            <div className="ac-chip-row">
              <button
                type="button"
                onClick={() => setTrackingMode("auto")}
                className={`ac-chip${trackingMode === "auto" ? " is-selected" : ""}`}
              >
                <span className="ac-chip-title">Auto Face Tracking</span>
                <span className="ac-chip-sub">Follows the main speaker</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackingMode("center")}
                className={`ac-chip${trackingMode === "center" ? " is-selected" : ""}`}
              >
                <span className="ac-chip-title">Center Crop</span>
                <span className="ac-chip-sub">Static center, no tracking</span>
              </button>
            </div>
          </div>

          {trackingMode === "auto" && (
            <div className="ac-section">
              <span className="ac-section-title">Tracking Engine</span>
              <div className="ac-chip-row">
                <button
                  type="button"
                  onClick={() => setFaceTrackingEngine("haar")}
                  className={`ac-chip${faceTrackingEngine === "haar" ? " is-selected" : ""}`}
                >
                  <span className="ac-chip-title">Haar Cascade</span>
                  <span className="ac-chip-sub">Faster (default)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFaceTrackingEngine("mediapipe")}
                  className={`ac-chip${faceTrackingEngine === "mediapipe" ? " is-selected" : ""}`}
                >
                  <span className="ac-chip-title">MediaPipe AI</span>
                  <span className="ac-chip-sub">Smoother, heavier</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Canvas Config Controls */}
      {outputStyle === "canvas_blur" && (
        <div className="pt-3 border-t border-border">
          <CanvasConfigControls 
            config={canvasConfig} 
            onChange={setCanvasConfig} 
            showModeSwitch={true}
          />
        </div>
      )}

      {/* Burn Subtitles / Auto Hook / Gaming Video */}
      <div>
        <div className="ac-toggle-row">
          <div className="ac-toggle-text">
            <span className="ac-toggle-title">Burn Subtitles</span>
            <span className="ac-toggle-sub">Bakar subtitle ke video</span>
          </div>
          <ToggleSwitch checked={burnSubtitles} onChange={setBurnSubtitles} disabled={isSubmitting} />
        </div>

        <div className="ac-toggle-row">
          <div className="ac-toggle-text">
            <span className="ac-toggle-title">Auto Hook</span>
            <span className="ac-toggle-sub">3 detik terbaik diputar di awal klip</span>
          </div>
          <ToggleSwitch checked={enableHook} onChange={setEnableHook} disabled={isSubmitting} />
        </div>

        <div className="ac-toggle-row">
          <div className="ac-toggle-text">
            <span className="ac-toggle-title">Gaming Video</span>
            <span className="ac-toggle-sub">Deteksi facecam &amp; split-screen</span>
          </div>
          <ToggleSwitch checked={isGamingVideo} onChange={setIsGamingVideo} disabled={isSubmitting} />
        </div>
      </div>

      {/* Subtitle Config Controls */}
      {burnSubtitles && (
        <div className="pt-1">
          <SubtitleConfigControls
            config={subtitleConfig}
            onChange={setSubtitleConfig}
          />
        </div>
      )}

      {/* Advanced Drawer Toggle */}
      <div className="border border-border rounded-2xl bg-bg-surface/40 transition-all mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface/70 transition-colors border-0 ${showAdvanced ? "rounded-t-2xl" : "rounded-2xl"}`}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Transcription Settings</span>
          </div>
          <span className="text-[11px] text-text-tertiary font-mono">
            {showAdvanced ? "Hide options â–²" : "Show options â–¼"}
          </span>
        </button>

        {showAdvanced && (
          <div className="p-4 sm:p-5 border-t border-border space-y-5 bg-white animate-fadeIn text-xs">
            {/* Project Title */}
            <div className="space-y-1.5">
              <label htmlFor="project-title" className="font-medium text-text-secondary flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-text-tertiary" />
                <span>Project Title (Optional)</span>
              </label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Podcast Episode 5"
                className="w-full px-3.5 py-2 bg-bg-surface/50 border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Language, Whisper Model, Max Clips & Download Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-text-secondary flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>Transcription Language</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-surface/50 border border-border rounded-lg text-text-primary focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="auto">Auto Detect (Whisper VAD)</option>
                  <option value="id">Indonesian (Bahasa)</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-text-secondary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Faster Whisper Model</span>
                </label>
                <select
                  value={whisperModel}
                  onChange={(e) => setWhisperModel(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-surface/50 border border-border rounded-lg text-text-primary focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="small">small (Fastest, High Accuracy)</option>
                  <option value="medium">medium (Balanced for Podcast)</option>
                  <option value="large-v3">large-v3 (Maximum Accuracy)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-text-secondary flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>Max Clips</span>
                </label>
                <div className="relative" ref={clipsRef}>
                  <button
                    type="button"
                    onClick={() => setClipsOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={clipsOpen}
                    className="w-full px-3 py-2 flex items-center justify-between bg-bg-surface/50 border border-border rounded-lg text-text-primary text-left focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <span>
                      {maxClips === 0
                        ? "Auto (Based on duration)"
                        : `${maxClips} Clip${maxClips > 1 ? "s" : ""}`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform ${
                        clipsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {clipsOpen && (
                    <div
                      role="listbox"
                      className="absolute z-30 mt-1 w-full min-w-[11rem] p-1 bg-white border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="option"
                          aria-selected={maxClips === n}
                          onClick={() => {
                            setMaxClips(n);
                            setClipsOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 text-left whitespace-nowrap text-xs rounded ${
                            maxClips === n
                              ? "bg-[#2563eb] text-white"
                              : "hover:bg-bg-surface"
                          }`}
                        >
                          {n === 0
                            ? "Auto (Based on duration)"
                            : `${n} Clip${n > 1 ? "s" : ""}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-text-secondary flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>Download Quality</span>
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as "720p" | "1080p")}
                  className="w-full px-3 py-2 bg-bg-surface/50 border border-border rounded-lg text-text-primary focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="720p">720p (Faster, Smaller)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit: full width, always rendered */}
      <div>
        <button type="submit" disabled={isSubmitting} className="ac-submit">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing... Mengirim ke GPU Server</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Generate Klip Sekarang</span>
            </>
          )}
        </button>
        {!url.trim() && (
          <p className="ac-note warn">Isi URL video atau upload file dulu.</p>
        )}
        <p className="ac-note">
          {aiSelectClips
            ? `${maxClips > 0 ? Math.min(maxClips, 10) : "Otomatis"} klip · 50-300 detik · skor AI ≥ 65`
            : "Video dirender utuh sebagai satu klip"}
        </p>
      </div>
    </form>
  );
};

export default HeroInput;

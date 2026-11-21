import React from "react";
import { ScanFace, Layers, Monitor, Square, Check } from "lucide-react";

export type OutputStyle = "face_crop" | "canvas_blur" | "landscape" | "square";

export interface OutputStyleOption {
  id: OutputStyle;
  label: string;
  ratio: string;
  description: string;
  platforms: string;
  icon: React.ElementType;
  badge?: string;
  renderPreview: () => React.ReactNode;
}

export interface OutputStyleSelectorProps {
  value: OutputStyle | string;
  onChange: (value: OutputStyle) => void;
  disabled?: boolean;
  className?: string;
}

export const OUTPUT_STYLE_OPTIONS: OutputStyleOption[] = [
  {
    id: "face_crop",
    label: "Face Crop",
    ratio: "9:16",
    description: "AI tracks speaker face dynamically for portrait short-form video",
    platforms: "TikTok, Reels, Shorts",
    badge: "AI Powered",
    icon: ScanFace,
    renderPreview: () => (
      <div className="w-7 h-11 rounded border border-slate-300 bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-emerald-400 transition-colors">
        <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        </div>
        <div className="w-4 h-1.5 bg-slate-300 rounded-sm mt-1" />
      </div>
    ),
  },
  {
    id: "canvas_blur",
    label: "Canvas Blur",
    ratio: "9:16",
    description: "Original video centered on 9:16 canvas with blurred ambient background",
    platforms: "Stories, Shorts, Feed",
    badge: "Full View",
    icon: Layers,
    renderPreview: () => (
      <div className="w-7 h-11 rounded border border-slate-300 bg-slate-200 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-emerald-400 transition-colors">
        <div className="absolute inset-0 bg-slate-300/60 backdrop-blur-[1px]" />
        <div className="w-6 h-3.5 bg-white border border-emerald-400 rounded-sm z-10 shadow-sm flex items-center justify-center">
          <div className="w-3 h-1 bg-emerald-200 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "landscape",
    label: "Landscape",
    ratio: "16:9",
    description: "Standard widescreen format preserving original footage aspect ratio",
    platforms: "YouTube, Web, Desktop",
    icon: Monitor,
    renderPreview: () => (
      <div className="w-11 h-7 rounded border border-slate-300 bg-slate-100 flex items-center justify-center relative overflow-hidden group-hover:border-emerald-400 transition-colors">
        <div className="w-7 h-4 bg-white border border-slate-300 rounded-sm flex items-center justify-center">
          <div className="w-4 h-1.5 bg-slate-200 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "square",
    label: "Square",
    ratio: "1:1",
    description: "Balanced square format optimal for grid feeds and post carousels",
    platforms: "Instagram, LinkedIn, X",
    icon: Square,
    renderPreview: () => (
      <div className="w-8 h-8 rounded border border-slate-300 bg-slate-100 flex items-center justify-center relative overflow-hidden group-hover:border-emerald-400 transition-colors">
        <div className="w-5 h-5 bg-white border border-slate-300 rounded-sm flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm" />
        </div>
      </div>
    ),
  },
];

export const OutputStyleSelector: React.FC<OutputStyleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`ac-section ${className}`}>
      <div className="ac-row">
        <span className="ac-section-title">Output Video Format</span>
        <span className="ac-section-hint">Aspect Ratio &amp; Cropping</span>
      </div>

      <div role="radiogroup" aria-label="Output Style Selector" className="ac-style-grid">
        {OUTPUT_STYLE_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`ac-style-card${isSelected ? " is-selected" : ""}`}
            >
              <div className="ac-style-head">
                <span className="ac-style-icon">
                  <Icon />
                </span>
                <span className="ac-style-label">{option.label}</span>
                <span className="ac-style-ratio">{option.ratio}</span>
                <span className={`ac-radio${isSelected ? " is-selected" : ""}`}>
                  {isSelected && <Check />}
                </span>
              </div>
              <p className="ac-style-desc">{option.description}</p>
              <span className="ac-style-platforms">{option.platforms}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OutputStyleSelector;

import React from "react";
import { Download, Sparkles, Pencil, Star } from "lucide-react";
import { getVideoStreamUrl, getDownloadUrl } from "../api";
import { VideoPreview } from "./VideoPreview";

export interface ClipCardProps {
  clip: {
    path: string;
    description?: string;
    description_en?: string;
    description_id?: string;
    start?: string | number;
    end?: string | number;
    subs?: boolean;
    social?: any;
    v?: number;
    score?: number;
  };
  index: number;
  jobId: string;
  onEditSubtitle?: () => void;
  onOpenSocialKit?: () => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  index,
  onEditSubtitle,
  onOpenSocialKit,
}) => {
  const title = clip.social?.title || `Clip #${index + 1}`;
  const description =
    clip.description_id || clip.description_en || clip.description || "";

  const hasSocial = Boolean(
    clip.social &&
      (clip.social.titles_id?.length ||
        clip.social.titles_en?.length ||
        clip.social.description_id ||
        clip.social.description_en ||
        clip.social.hashtags_id?.length)
  );

  return (
    <div className="w-[240px] sm:w-64 shrink-0 snap-start bg-white border border-border rounded-xl p-2.5 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
      {/* Video Preview (sizes itself) */}
      <VideoPreview src={getVideoStreamUrl(clip.path, clip.v)} />

      {/* Info & Description */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <h4 className="font-bold text-text-primary text-xs truncate" title={title}>
            {title}
          </h4>
          {typeof clip.score === "number" && (
            <div
              className={`flex items-center gap-0.5 px-1 py-0.5 rounded border text-[10px] font-bold shrink-0 ${
                clip.score >= 80
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
              title="AI virality score (0-100)"
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{clip.score}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
          {description || "No description provided."}
        </p>

        {/* Social Kit Button */}
        {hasSocial && onOpenSocialKit && (
          <button
            onClick={onOpenSocialKit}
            className="mt-1.5 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Social Kit</span>
          </button>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border">
          {onEditSubtitle && (
            <button
              onClick={onEditSubtitle}
              className="flex-1 py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
              title="Correct Subtitle & Rerender"
            >
              <Pencil className="w-3 h-3" />
              <span className="truncate">Koreksi Subtitle</span>
            </button>
          )}

          <a
            href={getDownloadUrl(clip.path, clip.v)}
            download
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-text-primary border border-border rounded-lg flex items-center justify-center transition-colors shrink-0"
            title="Download Video Clip"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

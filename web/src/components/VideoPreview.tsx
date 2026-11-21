import React, { useState } from "react";
import { AlertTriangle, ExternalLink, Play, RefreshCw } from "lucide-react";

// Module-level handle on the currently armed player: arming a second one
// unloads the first, so two 1080p decodes can't stack up on the CPU.
let stopActivePreview: (() => void) | null = null;

/**
 * Clip player for the result/history cards.
 *
 * Owns its own size — callers must NOT wrap it in a forced aspect ratio.
 * - alive: short 16:9-ish strip (not a tall 9:16 box) with a Play overlay. The
 *   <video> mounts only after the click, so a grid of 12 clips starts zero
 *   decoders.
 * - dead : compact warning card, not a giant empty panel.
 *
 * Clip files live on an ephemeral Colab/Kaggle disk, so an old job can still be
 * listed in the DB while its file is gone.
 */
export const VideoPreview: React.FC<{
  src: string;
  onRerender?: () => void;
}> = ({ src, onRerender }) => {
  const [failed, setFailed] = useState(false);
  const [detail, setDetail] = useState("");
  const [armed, setArmed] = useState(false);

  const arm = () => {
    stopActivePreview?.();
    stopActivePreview = () => setArmed(false);
    setArmed(true);
  };

  // A <video> element only reports "error" with no reason. Ask the backend for
  // the JSON body so a 403 "Access denied" shows which path was rejected.
  const handleError = async () => {
    setArmed(false);
    setFailed(true);
    try {
      const res = await fetch(src, { headers: { Range: "bytes=0-1" } });
      const body = JSON.parse(await res.text());
      if (body?.requested_path) {
        setDetail(`${body.message}: ${body.requested_path}`);
      } else if (body?.message) {
        setDetail(String(body.message));
      }
    } catch {
      // HTML interstitial (ngrok) or unreadable body: keep the generic text.
    }
  };

  if (failed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 flex items-start gap-1.5 text-left">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-amber-900 leading-tight">
            Video tidak tersedia
          </p>
          <p
            className="text-[10px] text-amber-700 leading-snug line-clamp-1 break-all"
            title={
              detail ||
              "File klip sudah hilang dari server (sesi Colab/Kaggle berakhir)."
            }
          >
            {detail ||
              "File klip sudah hilang dari server (sesi Colab/Kaggle berakhir)."}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-200 text-[10px] font-medium text-amber-900 flex items-center gap-1"
            >
              <ExternalLink className="w-2.5 h-2.5" /> Buka
            </a>
            {onRerender && (
              <button
                onClick={onRerender}
                className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-[10px] font-semibold text-white flex items-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Render ulang
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[104px] shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-border">
      {armed ? (
        <video
          key={src}
          src={src}
          controls
          autoPlay
          playsInline
          preload="metadata"
          onError={handleError}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : (
        <button
          type="button"
          onClick={arm}
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Putar video"
        >
          <Play className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Preview</span>
        </button>
      )}
    </div>
  );
};

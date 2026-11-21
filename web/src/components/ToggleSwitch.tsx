import React from 'react';
import { Check, X } from 'lucide-react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Show the explicit ON/OFF pill next to the track (default: true). */
  showState?: boolean;
}

/**
 * ON = green track + glow + ✓, OFF = grey track + ✗.
 *
 * Deliberately NOT a <label> wrapping a <button> plus a hidden checkbox: that
 * fires onChange twice per click (button handler + label activation of the
 * checkbox), which made the switch appear to never move.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  showState = true,
}) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || (checked ? 'Aktif' : 'Nonaktif')}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`ac-toggle${checked ? ' is-on' : ''}`}
    >
      <span className="ac-toggle-knob">
        {checked ? (
          <Check className="h-3 w-3 stroke-[3] text-emerald-600" />
        ) : (
          <X className="h-3 w-3 stroke-[3] text-slate-400" />
        )}
      </span>
    </button>

    {showState && (
      <span className={`ac-toggle-state${checked ? ' is-on' : ''}`}>
        {checked ? 'ON' : 'OFF'}
      </span>
    )}

    {label && <span className="text-xs font-medium text-text-primary">{label}</span>}
  </div>
);

export default ToggleSwitch;

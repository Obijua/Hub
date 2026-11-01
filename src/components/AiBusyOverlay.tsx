import React from 'react';
import { Loader2 } from 'lucide-react';

interface AiBusyOverlayProps {
  busy: boolean;
  label?: string;
}

export default function AiBusyOverlay({ busy, label = "Writing with AI…" }: AiBusyOverlayProps) {
  if (!busy) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        background: 'rgba(255, 255, 255, 0.78)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '2px',
      }}
    >
      <Loader2 size={24} color="#1E3B8B" className="animate-spin" />
      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

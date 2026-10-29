import React, { useEffect, useRef, useState } from 'react';

interface AdRendererProps {
  adCode: string;
  className?: string;
  onEmpty?: (isEmpty: boolean) => void;
}

export const AdRenderer: React.FC<AdRendererProps> = ({ adCode, className = '', onEmpty }) => {
  if (!adCode || !adCode.trim()) return null;

  const [height, setHeight] = useState<number>(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasValidHeightRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onEmptyRef = useRef(onEmpty);

  useEffect(() => {
    onEmptyRef.current = onEmpty;
  }, [onEmpty]);

  useEffect(() => {
    hasValidHeightRef.current = false;
    setHeight(100);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'hj-ad-ready') {
        iframeRef.current.contentWindow?.postMessage(
          { type: 'hj-ad', html: adCode },
          window.location.origin
        );

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (!hasValidHeightRef.current) {
            setHeight(0);
            onEmptyRef.current?.(true);
          }
        }, 6000);
      } else if (data.type === 'hj-ad-height') {
        const newHeight = Number(data.height);
        if (!isNaN(newHeight) && newHeight > 20) {
          hasValidHeightRef.current = true;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          const clamped = Math.min(Math.max(newHeight, 30), 600);
          setHeight(clamped);
          onEmptyRef.current?.(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [adCode]);

  return (
    <div 
      className={`flex justify-center w-full overflow-hidden ${className}`}
      style={height === 0 ? { height: 0 } : undefined}
    >
      <iframe
        ref={iframeRef}
        src="/ad-frame.html"
        title="Advertisement"
        loading="lazy"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        style={{
          width: '100%',
          maxWidth: '100%',
          height: `${height}px`,
          border: 'none',
          overflow: 'hidden',
          background: 'transparent'
        }}
      />
    </div>
  );
};

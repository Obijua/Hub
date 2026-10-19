import React, { useEffect, useRef, useState } from 'react';

interface AdRendererProps {
  adCode: string;
  className?: string;
}

export const AdRenderer: React.FC<AdRendererProps> = ({ adCode, className = '' }) => {
  if (!adCode || !adCode.trim()) return null;

  const [height, setHeight] = useState<number>(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
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
      } else if (data.type === 'hj-ad-height') {
        const newHeight = Number(data.height);
        if (!isNaN(newHeight) && newHeight > 0) {
          const clamped = Math.min(Math.max(newHeight, 30), 600);
          setHeight(clamped);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [adCode]);

  return (
    <div className={`flex justify-center w-full overflow-hidden ${className}`}>
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

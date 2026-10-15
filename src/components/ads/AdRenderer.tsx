import React from 'react';

interface AdRendererProps {
  adCode: string;
  className?: string;
}

export const AdRenderer: React.FC<AdRendererProps> = ({ adCode, className = '' }) => {
  if (!adCode || !adCode.trim()) return null;

  const heightMatch = adCode.match(/['"]height['"]\s*:\s*(\d+)/i) || adCode.match(/height\s*=\s*['"]?(\d+)/i);
  const widthMatch = adCode.match(/['"]width['"]\s*:\s*(\d+)/i) || adCode.match(/width\s*=\s*['"]?(\d+)/i);
  const height = heightMatch ? parseInt(heightMatch[1]) : 250;
  const width = widthMatch ? parseInt(widthMatch[1]) : 300;

  const srcDocContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
            overflow: hidden;
            width: 100%;
            height: 100%;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${adCode}
      </body>
    </html>
  `;

  return (
    <div className={`flex justify-center w-full overflow-hidden ${className}`}>
      <iframe
        srcDoc={srcDocContent}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
        style={{
          width: width > 728 ? '100%' : `${width}px`,
          maxWidth: '100%',
          height: `${height}px`,
          border: 'none',
          overflow: 'hidden',
          background: 'transparent'
        }}
        title="Advertisement"
        scrolling="no"
      />
    </div>
  );
};

import { useEffect } from 'react';

export interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  type?: string;
}

export function setJsonLd(id: string, data: object | null) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    if (script) {
      script.remove();
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(data);

  return () => {
    const el = document.getElementById(id);
    if (el) el.remove();
  };
}

export function stripHtmlToPlainText(html: string, maxLength?: number): string {
  if (!html) return '';
  let text = String(html)
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|ul|ol)>/gi, ' ')
    .replace(/<[^>]*>?/gm, '');

  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ''; }
    })
    .replace(/&#([0-9]+);/gi, (_, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return ''; }
    })
    .replace(/&amp;/gi, '&');

  // Remove invisible characters: U+200B, U+200C, U+200D, U+2060, U+FEFF, U+00AD
  // Turn U+00A0 into normal space
  text = text
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g, '')
    .replace(/\u00A0/g, ' ');

  text = text.replace(/\s+/g, ' ').trim();

  if (maxLength && text.length > maxLength) {
    const limit = maxLength - 1;
    let cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0) {
      cut = cut.slice(0, lastSpace);
    }
    text = cut + '…';
  }

  return text;
}

export function buildPageTitle(title: string, company: string, location: string): string {
  let T = title || 'Opportunity';
  if (T && T === T.toUpperCase() && /[A-Z]/.test(T)) {
    T = T.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
  }

  let L = location ? String(location).trim() : '';
  if (L.toLowerCase() === 'nationwide') {
    L = 'Nigeria';
  }

  const hasComp = company && String(company).trim() !== '' && company !== 'Featured Employer';
  const hasLoc = L !== '';

  let fullTitle = '';
  if (hasComp && hasLoc) {
    fullTitle = `${T} at ${company} – ${L} | Hub & Jobs`;
  } else if (hasLoc) {
    if (L.toLowerCase() === 'remote') {
      fullTitle = `${T} – Remote | Hub & Jobs`;
    } else {
      fullTitle = `${T} in ${L} | Hub & Jobs`;
    }
  } else if (hasComp) {
    fullTitle = `${T} at ${company} | Hub & Jobs`;
  } else {
    fullTitle = `${T} | Hub & Jobs`;
  }

  if (fullTitle.length > 65) {
    fullTitle = `${T} | Hub & Jobs`;
  }

  if (fullTitle.length > 65) {
    const suffix = ' | Hub & Jobs';
    const availableForT = 65 - suffix.length - 1;
    if (availableForT > 0 && T.length > availableForT) {
      let subT = T.slice(0, availableForT);
      const lastSpace = subT.lastIndexOf(' ');
      if (lastSpace > 0) {
        subT = subT.slice(0, lastSpace);
      }
      T = subT + '…';
    } else {
      T = T.slice(0, Math.max(0, 65 - suffix.length));
    }
    fullTitle = `${T}${suffix}`;
  }

  return fullTitle;
}

export function useSeo({
  title,
  description,
  path,
  image = 'https://www.hubandjobs.com/og-image.jpg',
  noindex = false,
  type = 'website'
}: SeoProps) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // 2. Clean description: strip HTML and truncate to 155 chars
    const cleanDesc = stripHtmlToPlainText(description, 155);

    // 3. Canonical URL: no query string, no trailing slash except root
    const cleanPath = path.split('?')[0];
    const canonicalPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '');
    const canonicalUrl = `https://www.hubandjobs.com${canonicalPath}`;

    // Helper to upsert meta tag
    const upsertMeta = (attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to upsert link tag
    const upsertLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Update tags
    upsertMeta('name', 'description', cleanDesc);
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    
    upsertLink('canonical', canonicalUrl);

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', cleanDesc);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:type', type);
    if (image) {
      upsertMeta('property', 'og:image', image);
    }

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', cleanDesc);
    if (image) {
      upsertMeta('name', 'twitter:image', image);
    }
  }, [title, description, path, image, noindex, type]);
}

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

function stripHtml(html: string): string {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|ul|ol)>/gi, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
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

    // 2. Clean description: strip HTML and truncate to 160 chars
    const cleanDesc = stripHtml(description)
      .slice(0, 160);

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

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from './SiteConfigContext';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  schema?: any;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  keywords,
  schema
}) => {
  const { config } = useSiteConfig();

  const defaultTitle = config?.siteName || 'Hub & Jobs | Jobs, Scholarships & Opportunities in Nigeria';
  const defaultDescription = config?.metaDescription || 'Hub & Jobs is Nigeria\'s #1 platform for the latest job vacancies, scholarships, free courses, Udemy coupons and internships. Updated daily.';
  const defaultKeywords = config?.metaKeywords || 'jobs in Nigeria, scholarships for Nigerians, hub and jobs';
  const defaultImage = 'https://picsum.photos/seed/hubandjobs/1200/630';

  const finalTitle = title ? (title.includes(defaultTitle) ? title : `${title} | ${defaultTitle}`) : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalImage = image || defaultImage;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": config?.siteName || "Hub & Jobs",
    "url": "https://hubandjobs.com",
    "logo": config?.logoUrl || "https://picsum.photos/seed/hubandjobs/200/200",
    "description": "Nigeria's hub for jobs, scholarships and opportunities",
    "sameAs": [
      "https://facebook.com/hubandjobs",
      "https://twitter.com/hubandjobs",
      "https://linkedin.com/company/hubandjobs"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Nigeria"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "NG"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": config?.siteName || "Hub & Jobs",
    "url": "https://hubandjobs.com",
    "description": config?.metaDescription || "Nigeria's hub for jobs, scholarships and opportunities",
    "publisher": {
      "@id": `${window.location.origin}/#organization`
    },
    "areaServed": {
      "@type": "Country",
      "name": "Nigeria"
    }
  };

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <link rel="canonical" href={url} />

      {/* Target Nigeria specifically */}
      <meta name="geo.region" content="NG" />
      <meta name="geo.country" content="Nigeria" />
      <meta name="geo.placename" content="Nigeria" />
      <meta name="language" content="English" />
      <meta name="content-language" content="en-NG" />

      {/* Alternates */}
      <link rel="alternate" hrefLang="en-NG" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Verification Tags */}
      {config?.googleSearchConsoleId && (
        <meta name="google-site-verification" content={config.googleSearchConsoleId} />
      )}
      {config?.bingWebmasterId && (
        <meta name="msvalidate.01" content={config.bingWebmasterId} />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={url} />
      {config?.facebookPixelId && (
        <meta property="fb:app_id" content={config.facebookPixelId} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

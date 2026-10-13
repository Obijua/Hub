import { VercelRequest, VercelResponse } from '@vercel/node';
import firebaseConfig from '../firebase-applet-config.json';

function parseFirestoreField(field: any): any {
  if (!field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return parseInt(field.integerValue, 10);
  if ('doubleValue' in field) return parseFloat(field.doubleValue);
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue' in field) return (field.arrayValue.values || []).map(parseFirestoreField);
  if ('mapValue' in field) {
    const obj: any = {};
    const fields = field.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      obj[k] = parseFirestoreField(fields[k]);
    }
    return obj;
  }
  return null;
}

function parseFirestoreDoc(doc: any): any {
  const fields = doc.fields || {};
  const obj: any = { id: doc.name.split('/').pop() };
  for (const k of Object.keys(fields)) {
    obj[k] = parseFirestoreField(fields[k]);
  }
  return obj;
}

async function queryFirestoreBySlug(collectionId: string, slug: string, projectId: string, dbId: string, apiKey: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: slug }
        }
      },
      limit: 1
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Firestore query failed: ${res.status} ${res.statusText}`);
  }

  const results = await res.json();
  for (const row of results) {
    if (row.document) {
      return parseFirestoreDoc(row.document);
    }
  }
  return null;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const type = req.query.type as string;
  const slug = req.query.slug as string;

  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000') as string;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const indexUrl = `${protocol}://${host}/index.html`;

  let indexHtml = '';
  const controller1 = new AbortController();
  const timeout1 = setTimeout(() => controller1.abort(), 5000);
  try {
    const indexRes = await fetch(indexUrl, { signal: controller1.signal });
    clearTimeout(timeout1);
    if (indexRes.ok) {
      indexHtml = await indexRes.text();
    }
  } catch (err) {
    clearTimeout(timeout1);
  }

  if (!indexHtml) {
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 5000);
    try {
      const fallbackRes = await fetch('https://www.hubandjobs.com/index.html', { signal: controller2.signal });
      clearTimeout(timeout2);
      if (fallbackRes.ok) {
        indexHtml = await fallbackRes.text();
      }
    } catch (err) {
      clearTimeout(timeout2);
    }
  }

  if (!indexHtml) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '5');
    return res.status(503).send(`<!doctype html><html><head><meta http-equiv="refresh" content="3"><title>Hub & Jobs</title></head><body>Hub & Jobs is loading, please wait...</body></html>`);
  }

  try {
    const { projectId, apiKey, firestoreDatabaseId } = firebaseConfig;
    const dbId = firestoreDatabaseId || '(default)';

    if (!type || !slug) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(indexHtml);
    }

    let docData: any = null;
    let path = '';

    if (type === 'post') {
      docData = await queryFirestoreBySlug('posts', slug, projectId, dbId, apiKey);
      path = `/post/${slug}`;
    } else if (type === 'category') {
      docData = await queryFirestoreBySlug('categories', slug, projectId, dbId, apiKey);
      path = `/category/${slug}`;
    }

    if (!docData) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(indexHtml);
    }

    let title = '';
    let description = '';
    let image = 'https://www.hubandjobs.com/og-image.jpg';

    if (type === 'post') {
      title = docData.title ? `${docData.title} | Hub & Jobs` : 'Opportunity Details | Hub & Jobs';
      const rawDesc = docData.description || docData.title || '';
      description = stripHtml(rawDesc).slice(0, 150) || 'Read details on Hub & Jobs.';

      if (docData.thumbnail) {
        image = docData.thumbnail;
      } else if (docData.ogImage) {
        image = docData.ogImage;
      }
    } else if (type === 'category') {
      const catName = docData.name || slug;
      title = docData.name ? `${docData.name} Opportunities in Nigeria | Hub & Jobs` : `${slug?.toUpperCase() || 'Category'} | Hub & Jobs`;
      description = docData.description ? stripHtml(docData.description).slice(0, 150) : `Explore latest ${catName} opportunities, jobs, and updates in Nigeria on Hub & Jobs.`;
    }

    const escapedTitle = escapeHtml(title);
    const escapedDesc = escapeHtml(description);
    const escapedImage = escapeHtml(image);
    const escapedCanonical = escapeHtml(`https://www.hubandjobs.com${path}`);

    let html = indexHtml;

    // Remove existing title, meta, canonical, og, twitter tags
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
    html = html.replace(/<meta\b[^>]*\b(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '');
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*\/?>/gi, '');

    const seoTags = `
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDesc}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${escapedCanonical}" />
  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDesc}" />
  <meta property="og:url" content="${escapedCanonical}" />
  <meta property="og:type" content="website" />
  ${image ? `<meta property="og:image" content="${escapedImage}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  ${image ? `<meta name="twitter:image" content="${escapedImage}" />` : ''}
</head>`;

    html = html.replace('</head>', () => seoTags);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (error: any) {
    console.error("API page SSR error:", error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(indexHtml);
  }
}

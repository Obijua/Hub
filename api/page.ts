import { VercelRequest, VercelResponse } from '@vercel/node';

const firebaseConfig = {
  projectId: "gen-lang-client-0480166612",
  apiKey: "AIzaSyD-OXJWKbcGkonKqvFtKfvgHxNQxLfsGCk",
  firestoreDatabaseId: "ai-studio-4bf2f3e8-c4c1-46a4-b89d-ff92002e9be3"
};

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
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'isActive' },
                op: 'EQUAL',
                value: { booleanValue: true }
              }
            }
          ]
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

async function queryCategoryBySlug(slug: string, projectId: string, dbId: string, apiKey: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'categories' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'slug' },
                op: 'EQUAL',
                value: { stringValue: slug }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'isActive' },
                op: 'EQUAL',
                value: { booleanValue: true }
              }
            }
          ]
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

async function fetchPostById(id: string, projectId: string, dbId: string, apiKey: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/posts/${id}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Firestore get failed: ${res.status}`);
  }
  const doc = await res.json();
  return parseFirestoreDoc(doc);
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

    if (!type) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(indexHtml);
    }

    let docData: any = null;
    let path = '';

    if (type === 'post') {
      if (!slug) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(indexHtml);
      }
      docData = await queryFirestoreBySlug('posts', slug, projectId, dbId, apiKey);
      path = `/post/${slug}`;
    } else if (type === 'category') {
      if (!slug) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(indexHtml);
      }
      docData = await queryCategoryBySlug(slug, projectId, dbId, apiKey);
      path = `/category/${slug}`;
    } else if (type === 'job') {
      const jobId = req.query.id as string;
      if (!jobId) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(indexHtml);
      }
      docData = await fetchPostById(jobId, projectId, dbId, apiKey);
      if (!docData) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(indexHtml);
      }
      if (docData.slug && String(docData.slug).trim() !== '') {
        res.setHeader('Location', `https://www.hubandjobs.com/post/${docData.slug}`);
        res.setHeader('Cache-Control', 'public, s-maxage=3600');
        return res.status(301).send('');
      }
      path = `/jobs/${jobId}`;
    }

    if (!docData) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(indexHtml);
    }

    let title = '';
    let description = '';
    let image = 'https://www.hubandjobs.com/og-image.jpg';

    if (type === 'post' || type === 'job') {
      title = docData.title ? `${docData.title} | Hub & Jobs` : 'Opportunity Details | Hub & Jobs';
      const rawDesc = docData.description || docData.title || '';
      description = stripHtml(rawDesc).slice(0, 150) || 'Read details on Hub & Jobs.';
    } else if (type === 'category') {
      const catName = docData.name || slug;
      title = docData.name ? `${docData.name} Opportunities in Nigeria | Hub & Jobs` : `${slug?.toUpperCase() || 'Category'} | Hub & Jobs`;
      description = docData.description ? stripHtml(docData.description).slice(0, 150) : `Explore latest ${catName} opportunities, jobs, and updates in Nigeria on Hub & Jobs.`;
    }

    const candidateImage = docData.thumbnail || docData.ogImage || docData.image || '';
    if (typeof candidateImage === 'string' && candidateImage.startsWith('https://')) {
      image = candidateImage;
    }

    const isDefaultImage = image === 'https://www.hubandjobs.com/og-image.jpg';

    const escapedTitle = escapeHtml(title);
    const escapedDesc = escapeHtml(description);
    const escapedImage = escapeHtml(image);
    const escapedCanonical = escapeHtml(`https://www.hubandjobs.com${path}`);

    let html = indexHtml;

    // Remove existing title, meta, canonical, og, twitter tags
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
    html = html.replace(/<meta\b[^>]*\b(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+|og:image:[^"']+)["'][^>]*>/gi, '');
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
  <meta property="og:image" content="${escapedImage}" />
  ${isDefaultImage ? '<meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />' : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  <meta name="twitter:image" content="${escapedImage}" />
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

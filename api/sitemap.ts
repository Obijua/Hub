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

async function fetchAllPosts(projectId: string, dbId: string, apiKey: string) {
  let posts: any[] = [];
  let pageToken: string | null = null;
  let fetchedCount = 0;

  do {
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/posts?pageSize=300&key=${apiKey}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      const respText = await res.text();
      const detail = respText.replace(new RegExp(apiKey, 'g'), '[REDACTED]');
      const msg = `Error generating sitemap | step: posts | status: ${res.status} | detail: ${detail.slice(0, 300)}`;
      console.error(msg);
      throw new Error(msg);
    }
    const data = await res.json();
    const docs = data.documents || [];
    for (const d of docs) {
      posts.push(parseFirestoreDoc(d));
      fetchedCount++;
      if (fetchedCount >= 1000) break;
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken && fetchedCount < 1000);

  return posts;
}

async function fetchCategories(projectId: string, dbId: string, apiKey: string) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'categories' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'isActive' },
            op: 'EQUAL',
            value: { booleanValue: true }
          }
        },
        orderBy: [
          {
            field: { fieldPath: 'displayOrder' },
            direction: 'ASCENDING'
          }
        ]
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const respText = await res.text();
      const detail = respText.replace(new RegExp(apiKey, 'g'), '[REDACTED]');
      const msg = `Error generating sitemap | step: categories | status: ${res.status} | detail: ${detail.slice(0, 300)}`;
      console.error(msg);
      throw new Error(msg);
    }
    const results = await res.json();
    const categories: any[] = [];
    for (const row of results) {
      if (row.document) {
        categories.push(parseFirestoreDoc(row.document));
      }
    }
    return categories;
  } catch (e: any) {
    if (e.message && e.message.startsWith('Error generating sitemap')) {
      throw e;
    }
    const sanitizedMsg = String(e.message || e).replace(new RegExp(apiKey, 'g'), '[REDACTED]');
    const msg = `Error generating sitemap | step: categories | status: 0 | detail: ${sanitizedMsg.slice(0, 300)}`;
    console.error(msg);
    throw new Error(msg);
  }
}

function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const { projectId, apiKey, firestoreDatabaseId } = firebaseConfig;
    const dbId = firestoreDatabaseId || '(default)';
    const baseUrl = 'https://www.hubandjobs.com';

    const [posts, categories] = await Promise.all([
      fetchAllPosts(projectId, dbId, apiKey),
      fetchCategories(projectId, dbId, apiKey)
    ]);

    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/jobs', changefreq: 'daily', priority: '0.9' },
      { url: '/documents/cv', changefreq: 'weekly', priority: '0.8' },
      { url: '/documents', changefreq: 'weekly', priority: '0.8' },
      { url: '/blog', changefreq: 'daily', priority: '0.8' },
      { url: '/about', changefreq: 'monthly', priority: '0.5' },
      { url: '/contact', changefreq: 'monthly', priority: '0.5' },
      { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
      { url: '/disclaimer', changefreq: 'yearly', priority: '0.3' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const cat of categories) {
      const slug = cat.slug || cat.id;
      if (slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/category/${escapeXml(slug)}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    for (const post of posts) {
      if (post.isActive === false) continue;
      const slug = post.slug || post.id;
      if (slug) {
        const rawDate = post.updatedAt || post.createdAt;
        let lastmod = '';
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              lastmod = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }

        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/post/${escapeXml(slug)}</loc>\n`;
        if (lastmod) {
          xml += `    <lastmod>${lastmod}</lastmod>\n`;
        }
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error: any) {
    const errText = error.message && error.message.startsWith('Error generating sitemap')
      ? error.message
      : `Error generating sitemap | step: xml | status: 0 | detail: ${String(error.message || error).replace(new RegExp(firebaseConfig.apiKey, 'g'), '[REDACTED]').slice(0, 300)}`;
    console.error(errText);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(500).send(errText);
  }
}

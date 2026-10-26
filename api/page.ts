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

async function queryPostsByCategory(catSlug: string, projectId: string, dbId: string, apiKey: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'posts' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'category' },
                op: 'EQUAL',
                value: { stringValue: catSlug }
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
      orderBy: [
        {
          field: { fieldPath: 'createdAt' },
          direction: 'DESCENDING'
        }
      ],
      limit: 50
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    return [];
  }

  const results = await res.json();
  const posts = [];
  for (const row of results) {
    if (row.document) {
      posts.push(parseFirestoreDoc(row.document));
    }
  }
  return posts;
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

function stripHtml(html: string, maxLength?: number): string {
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

function sanitizeHtml(html: string): string {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/definitions|\1>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/gi, '');
  s = s.replace(/\s+on[a-z]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');
  s = s.replace(/href\s*=\s*(["'])javascript:[^"']*\1/gi, 'href="#"');
  s = s.replace(/href\s*=\s*javascript:[^\s>]+/gi, 'href="#"');
  if (s.length > 20000) {
    s = s.slice(0, 20000);
  }
  return s;
}

function buildPageTitle(title: string, company: string, location: string): string {
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
      const company = docData.company || docData.companyName || docData.employer || docData.organizationName || docData.recruiterCompany || '';
      const location = docData.location || '';
      title = buildPageTitle(docData.title || '', company, location);

      const rawDesc = docData.description || docData.title || '';
      description = stripHtml(rawDesc, 155) || 'Read details on Hub & Jobs.';
    } else if (type === 'category') {
      const catName = docData.name || slug;
      title = docData.name ? `${docData.name} Opportunities in Nigeria | Hub & Jobs` : `${slug?.toUpperCase() || 'Category'} | Hub & Jobs`;
      description = docData.description ? stripHtml(docData.description, 155) : `Explore latest ${catName} opportunities, jobs, and updates in Nigeria on Hub & Jobs.`;
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

    // Inject crawler-visible content into <div id="root"></div>
    let contentHtml = '';
    try {
      if ((type === 'post' || type === 'job') && docData) {
        const postTitle = escapeHtml(docData.title || '');
        const company = docData.company || docData.companyName || docData.employer || docData.organizationName || docData.recruiterCompany || '';
        const location = docData.location || '';
        const rawJobType = docData.jobType || docData.type || '';

        const metaLineParts = [];
        if (company) metaLineParts.push(escapeHtml(company));
        if (location) metaLineParts.push(escapeHtml(location));
        if (rawJobType) metaLineParts.push(escapeHtml(rawJobType));
        const metaLine = metaLineParts.join(' • ');

        const sanitizedDesc = sanitizeHtml(docData.description || '');

        contentHtml = `
          <article style="font-family:system-ui,sans-serif;padding:16px;max-width:430px;margin:0 auto;color:#0f172a">
            <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;line-height:1.3">${postTitle}</h1>
            ${metaLine ? `<p style="font-size:14px;color:#475569;margin-bottom:16px">${metaLine}</p>` : ''}
            <div style="font-size:15px;line-height:1.6;word-break:break-word">${sanitizedDesc}</div>
            <p style="margin-top:24px"><a href="/" style="color:#1E3B8B;text-decoration:underline">Hub &amp; Jobs home</a></p>
          </article>
        `;
      } else if (type === 'category' && docData) {
        const catName = escapeHtml(docData.name || slug || 'Category');
        const catDesc = escapeHtml(docData.description ? stripHtml(docData.description, 155) : `Explore latest ${catName} opportunities, jobs, and updates in Nigeria on Hub & Jobs.`);

        const catPosts = await queryPostsByCategory(slug, projectId, dbId, apiKey);

        let postsListHtml = '';
        if (catPosts && catPosts.length > 0) {
          postsListHtml = '<ul style="padding-left:20px;line-height:2">';
          for (const p of catPosts) {
            const pTitle = escapeHtml(p.title || 'Untitled');
            const pPath = (p.slug && String(p.slug).trim() !== '') ? `/post/${p.slug}` : `/jobs/${p.id}`;
            postsListHtml += `<li><a href="${pPath}" style="color:#1E3B8B;text-decoration:underline">${pTitle}</a></li>`;
          }
          postsListHtml += '</ul>';
        } else {
          postsListHtml = '<p style="color:#475569">No opportunities found in this category yet.</p>';
        }

        contentHtml = `
          <div style="font-family:system-ui,sans-serif;padding:16px;max-width:430px;margin:0 auto;color:#0f172a">
            <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;line-height:1.3">${catName} Opportunities</h1>
            <p style="font-size:15px;color:#475569;margin-bottom:16px;line-height:1.5">${catDesc}</p>
            ${postsListHtml}
            <p style="margin-top:24px"><a href="/" style="color:#1E3B8B;text-decoration:underline">Hub &amp; Jobs home</a></p>
          </div>
        `;
      }
    } catch (contentErr) {
      console.error("Content block generation failed:", contentErr);
      contentHtml = '';
    }

    if (contentHtml) {
      html = html.replace('<div id="root"></div>', `<div id="root">${contentHtml}</div>`);
    }

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

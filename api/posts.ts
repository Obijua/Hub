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
  if ('nullValue' in field) return null;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, apiKey, firestoreDatabaseId } = firebaseConfig;
  const dbId = firestoreDatabaseId || '(default)';

  let limitVal = 50;
  if (req.query.limit) {
    const parsed = parseInt(req.query.limit as string, 10);
    if (!isNaN(parsed)) {
      limitVal = Math.max(1, Math.min(100, parsed));
    }
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'posts' }],
        orderBy: [
          {
            field: { fieldPath: 'createdAt' },
            direction: 'DESCENDING'
          }
        ],
        limit: limitVal
      }
    };

    let resFetch = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    let results: any[] = [];
    if (!resFetch.ok) {
      const fallbackBody = {
        structuredQuery: {
          from: [{ collectionId: 'posts' }],
          limit: 200
        }
      };
      const fallbackRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackBody)
      });
      if (!fallbackRes.ok) {
        const errText = await fallbackRes.text();
        const safeErr = errText.replace(new RegExp(apiKey, 'g'), '[REDACTED]');
        throw new Error(`Firestore query failed: ${fallbackRes.status} ${safeErr}`);
      }
      results = await fallbackRes.json();
    } else {
      results = await resFetch.json();
    }

    const posts: any[] = [];
    for (const row of results) {
      if (row.document) {
        posts.push(parseFirestoreDoc(row.document));
      }
    }

    posts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const finalPosts = posts.slice(0, limitVal);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ posts: finalPosts });
  } catch (error: any) {
    const errMsg = String(error?.message || error).replace(new RegExp(apiKey, 'g'), '[REDACTED]');
    console.error("API posts error:", errMsg);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: errMsg });
  }
}

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

// Firebase config from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0480166612",
  appId: "1:447223507341:web:bc13a97134b4bceb11b5c4",
  apiKey: "AIzaSyD-OXJWKbcGkonKqvFtKfvgHxNQxLfsGCk",
  authDomain: "gen-lang-client-0480166612.firebaseapp.com",
  storageBucket: "gen-lang-client-0480166612.firebasestorage.app",
  messagingSenderId: "447223507341"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-4bf2f3e8-c4c1-46a4-b89d-ff92002e9be3");

const SITE_URL = 'https://hubandjobs.com';

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/category/job', priority: '0.8', changefreq: 'daily' },
  { url: '/category/scholarship', priority: '0.8', changefreq: 'daily' },
  { url: '/category/free-course', priority: '0.8', changefreq: 'daily' },
  { url: '/category/udemy-coupon', priority: '0.8', changefreq: 'daily' },
  { url: '/category/internship', priority: '0.8', changefreq: 'daily' },
  { url: '/category/opportunity', priority: '0.8', changefreq: 'daily' },
  { url: '/saved', priority: '0.3', changefreq: 'never' },
];

const generateSitemap = async () => {
  const snap = await getDocs(
    query(collection(db, 'posts'), where('isActive', '==', true))
  );

  const postUrls = snap.docs.map(doc => {
    const data = doc.data();
    const updated = data.updatedAt?.toDate?.()?.toISOString()
      || new Date().toISOString();
    return `
  <url>
    <loc>${SITE_URL}/post/${data.slug}</loc>
    <lastmod>${updated}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join('')}
${postUrls.join('')}
</urlset>`;

  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }
  fs.writeFileSync('./public/sitemap.xml', xml);
  console.log(`Sitemap generated: ${postUrls.length} posts`);
  process.exit(0);
};

generateSitemap().catch(console.error);

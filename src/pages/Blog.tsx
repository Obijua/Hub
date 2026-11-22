import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { useSeo } from '../lib/seo';
import { postPath } from '../lib/utils';

const BLOG_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'how-to', label: 'How-to guides' },
  { value: 'grants-news', label: 'Grants & scholarships news' },
  { value: 'career-development', label: 'Career development' },
  { value: 'news', label: 'News' },
];

const BLOG_CATEGORY_LABELS: Record<string, string> = {
  'how-to': 'How-to guides',
  'grants-news': 'Grants & scholarships news',
  'career-development': 'Career development',
  'news': 'News',
};

const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const wrapDate = (dateVal: any) => {
  if (!dateVal) return null;
  if (typeof dateVal?.toDate === 'function') return dateVal;
  if (typeof dateVal?.seconds === 'number') {
    const d = new Date(dateVal.seconds * 1000);
    return {
      seconds: dateVal.seconds,
      nanoseconds: dateVal.nanoseconds || 0,
      toDate: () => d,
      toMillis: () => dateVal.seconds * 1000,
    };
  }
  const d = new Date(dateVal);
  const time = isNaN(d.getTime()) ? 0 : d.getTime();
  const seconds = Math.floor(time / 1000);
  const nanoseconds = (time % 1000) * 1000000;
  return {
    seconds,
    nanoseconds,
    toDate: () => d,
    toMillis: () => time,
  };
};

const getPostTime = (p: Post): number => {
  const ca = (p as any)?.createdAt;
  if (!ca) return 0;
  if (typeof ca?.toMillis === 'function') {
    try {
      return ca.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof ca?.toDate === 'function') {
    try {
      return ca.toDate().getTime();
    } catch {
      return 0;
    }
  }
  if (typeof ca?.seconds === 'number') {
    return ca.seconds * 1000;
  }
  if (typeof ca?._seconds === 'number') {
    return ca._seconds * 1000;
  }
  try {
    const t = new Date(ca).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
};

const formatDate = (p: Post): string => {
  const time = getPostTime(p);
  if (!time) return '';
  try {
    const d = new Date(time);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const extractPlainExcerpt = (html: string): string => {
  if (!html) return '';
  let text = String(html)
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|ul|ol|blockquote|tr|td|th)>/gi, ' ')
    .replace(/<[^>]*>?/gm, '');

  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .replace(/&#([0-9]+);/gi, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&amp;/gi, '&');

  text = text
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g, '')
    .replace(/\u00A0/g, ' ');

  return text.replace(/\s+/g, ' ').trim();
};

export const Blog = () => {
  useSeo({
    title: 'Career Advice, Job Search Tips & Guides | Hub & Jobs',
    description: 'Explore expert career advice, CV writing tips, interview guides, and scholarship application tips in Nigeria.',
    path: '/blog'
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    let cancelled = false;

    const loadBlogPosts = async () => {
      setLoading(true);
      let loadedPosts: Post[] = [];

      // 1. Try cached /api/posts?limit=100 first
      try {
        const res = await fetch('/api/posts?limit=100');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && Array.isArray(data.posts) && data.posts.length > 0) {
              loadedPosts = data.posts.map((p: any) => ({
                ...p,
                createdAt: wrapDate(p.createdAt),
                updatedAt: wrapDate(p.updatedAt),
              })) as Post[];
            }
          }
        }
      } catch {
        // Fall back to Firestore
      }

      if (cancelled) return;

      // 2. Fallback to Firestore query HomePage uses
      if (loadedPosts.length === 0) {
        try {
          const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          if (cancelled) return;
          loadedPosts = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as Post[];
        } catch (err) {
          console.error('Error fetching blog posts:', err);
        }
      }

      if (!cancelled) {
        const onlyBlogs = loadedPosts
          .filter((p: any) => p && s(p.postType) === 'blog' && s(p.title))
          .sort((a, b) => getPostTime(b) - getPostTime(a));
        setPosts(onlyBlogs);
        setLoading(false);
      }
    };

    loadBlogPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableCategories = useMemo(() => {
    const used = new Set(
      posts.map(p => s((p as any)?.blogCategory)).filter(Boolean)
    );
    return BLOG_CATEGORIES.filter(cat => used.has(cat.value));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts;
    return posts.filter(p => s((p as any)?.blogCategory) === selectedCategory);
  }, [posts, selectedCategory]);

  const handleSelectCategory = (catValue: string) => {
    setSelectedCategory(catValue);
    setVisibleCount(12);
  };

  return (
    <div style={{ backgroundColor: '#EEF2FF', minHeight: '100vh', paddingBottom: '96px', maxWidth: '430px', margin: '0 auto' }}>
      {/* Header Band */}
      <div style={{ backgroundColor: '#1E3B8B', padding: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.25' }}>
          Blog
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.4' }}>
          How-to guides, grants and scholarship news, and career advice.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          padding: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => handleSelectCategory('all')}
          style={{
            height: '36px',
            padding: '0 14px',
            fontSize: '14px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            backgroundColor: selectedCategory === 'all' ? '#1E3B8B' : '#ffffff',
            color: selectedCategory === 'all' ? '#ffffff' : '#475569',
            border: selectedCategory === 'all' ? '1px solid #1E3B8B' : '1px solid #E2E8F0',
            fontWeight: selectedCategory === 'all' ? 600 : 500,
          }}
        >
          All
        </button>
        {availableCategories.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleSelectCategory(cat.value)}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '14px',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                backgroundColor: isActive ? '#1E3B8B' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                border: isActive ? '1px solid #1E3B8B' : '1px solid #E2E8F0',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Article List */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '2px',
                  height: '132px',
                }}
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '2px',
              padding: '40px 16px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 10px 0' }}>
              No articles yet. Check back soon.
            </p>
            <Link
              to="/jobs"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1E3B8B',
                textDecoration: 'underline',
              }}
            >
              Browse opportunities
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredPosts.slice(0, visibleCount).map((post) => {
                const blogCatSlug = s((post as any)?.blogCategory);
                const blogCatLabel = BLOG_CATEGORY_LABELS[blogCatSlug] || blogCatSlug;
                const excerpt = extractPlainExcerpt(s((post as any)?.description));
                const dateStr = formatDate(post);

                return (
                  <Link
                    key={post.id}
                    to={postPath(post)}
                    state={{ job: post }}
                    style={{
                      display: 'block',
                      backgroundColor: '#ffffff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '2px',
                      padding: '16px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    {blogCatLabel && (
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#EEF2FF',
                          color: '#1E3B8B',
                          borderRadius: '2px',
                          padding: '2px 8px',
                          marginBottom: '8px',
                        }}
                      >
                        {blogCatLabel}
                      </span>
                    )}

                    <h2
                      className="line-clamp-3"
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: '1.35',
                        margin: '0 0 6px 0',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                      }}
                    >
                      {s(post.title)}
                    </h2>

                    {excerpt && (
                      <p
                        className="line-clamp-2"
                        style={{
                          fontSize: '14px',
                          color: '#475569',
                          lineHeight: '1.5',
                          margin: '0 0 10px 0',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        {excerpt}
                      </p>
                    )}

                    {dateStr && (
                      <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                        {dateStr}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {visibleCount < filteredPosts.length && (
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#ffffff',
                    color: '#1E3B8B',
                    border: '1px solid #1E3B8B',
                    borderRadius: '2px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;

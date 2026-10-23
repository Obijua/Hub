import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) + "-" + Date.now();
}

export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return "";
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  } catch (e) {
    return "";
  }
}

export function postPath(post: any): string {
  if (post && post.slug && typeof post.slug === 'string' && post.slug.trim() !== '') {
    return `/post/${post.slug}`;
  }
  return `/jobs/${post?.id || ''}`;
}

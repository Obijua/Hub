import { useState, useEffect } from 'react';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('cb_bookmarks') || '[]'
      );
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cb_bookmarks', 
      JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (postId: string) => {
    setBookmarks(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const isBookmarked = (postId: string) => 
    bookmarks.includes(postId);

  const clearAll = () => setBookmarks([]);

  return { bookmarks, toggleBookmark, isBookmarked, clearAll };
};

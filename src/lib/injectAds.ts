export const splitIntoParagraphs = (html: string): string[] => {
  // Split on closing paragraph, heading, or list tags
  const parts = html
    .split(/(?<=<\/p>|<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>)/gi)
    .map(p => p?.trim())
    .filter(p => p.length > 0);
  return parts;
};

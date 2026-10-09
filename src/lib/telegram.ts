const CATEGORY_EMOJI: Record<string, string> = {
  job: '💼',
  scholarship: '🎓',
  'free-course': '📚',
  'udemy-coupon': '🎟️',
  internship: '🏢',
  opportunity: '🌟',
};

const stripHtml = (html: string) =>
  html
    .replace(/<\/?(p|div|h[1-6]|li|br)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const sendTelegramPost = async ({
  botToken,
  channelId,
  post,
  template,
  siteUrl,
}: {
  botToken: string;
  channelId: string;
  post: any;
  template: string;
  siteUrl: string;
}) => {
  const emoji = CATEGORY_EMOJI[post.category] || '🌟';
  const categoryName = post.category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const snippet = stripHtml(post.description || '')
    .slice(0, 200);

  const deadline = post.deadline
    ? new Date(post.deadline.seconds 
        ? post.deadline.seconds * 1000 
        : post.deadline
      ).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'No deadline';

  const postUrl = `${siteUrl}/post/${post.slug}`;

  const tags = Array.isArray(post.tags)
    ? post.tags.map((t: string) => 
        '#' + t.replace(/\s+/g, '')).join(' ')
    : '';

  let message = (template || '').trim();
  
  // If template is empty, use a default one
  if (!message) {
    message = '<b>{title}</b>\n\n{description}\n\n🔗 <a href="{link}">Apply Here</a>\n\n#HubAndJobs #{category}';
  }

  const finalMessage = message
    .replace(/\[TITLE\]/g, post.title || '')
    .replace(/\{title\}/g, post.title || '')
    .replace(/\[CATEGORY\]/g, `${emoji} ${categoryName}`)
    .replace(/\{category\}/g, categoryName)
    .replace(/\[SNIPPET\]/g, snippet)
    .replace(/\{description\}/g, snippet)
    .replace(/\[DEADLINE\]/g, deadline)
    .replace(/\{deadline\}/g, deadline)
    .replace(/\[LOCATION\]/g, post.location || 'Nationwide')
    .replace(/\{location\}/g, post.location || 'Nationwide')
    .replace(/\[URL\]/g, postUrl)
    .replace(/\{link\}/g, postUrl)
    .replace(/\[TAGS\]/g, tags)
    .replace(/\{tags\}/g, tags);

  if (!botToken || !channelId) {
    throw new Error('Telegram bot token or channel ID is missing');
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: finalMessage || `<b>${post.title}</b>\n\n${snippet}\n\n🔗 <a href="${postUrl}">Apply Here</a>`,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    }
  );

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.description || 'Telegram post failed');
  }
  return result;
};

// Also send with photo if post has thumbnail
export const sendTelegramPostWithPhoto = async ({
  botToken,
  channelId,
  post,
  template,
  siteUrl,
}: {
  botToken: string;
  channelId: string;
  post: any;
  template: string;
  siteUrl: string;
}) => {
  // Build caption same way as message above
  const emoji = CATEGORY_EMOJI[post.category] || '🌟';
  const categoryName = post.category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const snippet = stripHtml(post.description || '').slice(0, 200);
  const deadline = post.deadline
    ? new Date(post.deadline.seconds 
        ? post.deadline.seconds * 1000 
        : post.deadline
      ).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : 'No deadline';
  const postUrl = `${siteUrl}/post/${post.slug}`;
  const tags = Array.isArray(post.tags)
    ? post.tags.map((t: string) => 
        '#' + t.replace(/\s+/g, '')).join(' ')
    : '';

  let caption = (template || '').trim();
  
  // If template is empty, use a default one
  if (!caption) {
    caption = '<b>{title}</b>\n\n{description}\n\n🔗 <a href="{link}">Apply Here</a>\n\n#HubAndJobs #{category}';
  }

  const finalCaption = caption
    .replace(/\[TITLE\]/g, post.title || '')
    .replace(/\{title\}/g, post.title || '')
    .replace(/\[CATEGORY\]/g, `${emoji} ${categoryName}`)
    .replace(/\{category\}/g, categoryName)
    .replace(/\[SNIPPET\]/g, snippet)
    .replace(/\{description\}/g, snippet)
    .replace(/\[DEADLINE\]/g, deadline)
    .replace(/\{deadline\}/g, deadline)
    .replace(/\[LOCATION\]/g, post.location || 'Nationwide')
    .replace(/\{location\}/g, post.location || 'Nationwide')
    .replace(/\[URL\]/g, postUrl)
    .replace(/\{link\}/g, postUrl)
    .replace(/\[TAGS\]/g, tags)
    .replace(/\{tags\}/g, tags);

  if (!botToken || !channelId) {
    throw new Error('Telegram bot token or channel ID is missing');
  }

  // Use sendPhoto if thumbnail exists, sendMessage if not
  const endpoint = post.thumbnail
    ? 'sendPhoto'
    : 'sendMessage';

  const body = post.thumbnail
    ? {
        chat_id: channelId,
        photo: post.thumbnail,
        caption: (finalCaption || `<b>${post.title}</b>`).slice(0, 1024), // Telegram caption limit
        parse_mode: 'HTML',
      }
    : {
        chat_id: channelId,
        text: finalCaption || `<b>${post.title}</b>\n\n${snippet}\n\n🔗 <a href="${postUrl}">Apply Here</a>`,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${endpoint}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.description || 'Telegram post failed');
  }
  return result;
};

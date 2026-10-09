import emailjs from '@emailjs/browser';

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export const sendWelcomeEmail = async (email: string) => {
  await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID,
    {
      to_email: email,
      site_name: 'Hub & Jobs',
      site_url: 'https://hubandjobs.com',
      unsubscribe_url: `https://hubandjobs.com/unsubscribe?email=${encodeURIComponent(email)}`,
    }
  );
};

export const sendNewPostAlert = async ({
  emails,
  post,
}: {
  emails: string[];
  post: any;
}) => {
  // Send to each subscriber (EmailJS free = 200/month)
  // For larger lists upgrade EmailJS or use Brevo free tier
  for (const email of emails) {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          post_title: post.title,
          post_category: post.category,
          post_snippet: post.description
            ?.replace(/<[^>]*>/g, '')
            .slice(0, 150) + '...',
          post_url: `${window.location.origin}/post/${post.slug}`,
          post_thumbnail: post.thumbnail || '',
          post_deadline: post.deadline
            ? new Date(post.deadline.seconds * 1000)
                .toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
            : 'No deadline',
          unsubscribe_url: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`,
        }
      );
    } catch (err) {
      console.error(`Failed to send email to ${email}:`, err);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
};

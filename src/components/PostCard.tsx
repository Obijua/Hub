import { Link } from 'react-router-dom';
import { Post } from '../types';
import { cn, stripHtml, postPath } from '../lib/utils';
import { MapPin, Wallet } from 'lucide-react';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

const getSnippet = (html: string): string => {
  if (!html) return '';
  const text = stripHtml(html);
  return text.slice(0, 80) + (text.length > 80 ? '...' : '');
};

const formatSalary = (salary?: string): string => {
  if (!salary || salary.toLowerCase() === 'negotiable') return 'Negotiable';
  // If it's just a number, add the Naira sign
  if (/^\d+$/.test(salary.replace(/,/g, ''))) {
    return `₦${salary}`;
  }
  // Otherwise just ensure it has the Naira sign if missing
  return salary.startsWith('₦') ? salary : `₦${salary}`;
};

const getTags = (postTags: any): string[] => {
  if (!postTags) return [];
  if (Array.isArray(postTags)) {
    return postTags.map((t: any) => String(t).trim()).filter(Boolean);
  }
  if (typeof postTags === 'string') {
    return postTags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
  return [];
};

export const PostCard = ({ post, featured = false }: PostCardProps) => {
  const snippet = getSnippet(post.description);
  const cardTags = getTags(post.tags);
  
  return (
    <Link to={postPath(post)} className="block">
      <div className={cn(
        "rounded-[1.5rem] bg-white border border-gray-100 p-8 flex flex-col gap-6",
        "transition-all duration-300",
        "hover:shadow-xl hover:shadow-gray-200/40 hover:border-primary/10",
        "active:scale-98 cursor-pointer group",
        featured && "ring-2 ring-primary/10 border-primary"
      )}>
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">
              {post.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              {cardTags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-[10px] font-bold">
                  {tag}
                </span>
              ))}
              <div className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                {post.category}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-gray-500">
            {post.location && (
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <MapPin size={16} className="text-gray-300" />
                {post.location}
              </div>
            )}
            <div className="flex items-center gap-1.5 font-black text-primary text-sm">
              <Wallet size={16} />
              {formatSalary(post.salary)}
            </div>
          </div>

          <p className="text-gray-500 font-medium text-base leading-relaxed line-clamp-2">
            {snippet}
          </p>
        </div>

        <div className="pt-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover:text-primary transition-colors">
            View Details & Apply →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;

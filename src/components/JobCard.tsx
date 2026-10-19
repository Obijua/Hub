import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { MapPin, Briefcase } from 'lucide-react';
import { stripHtmlToPlainText } from '../lib/seo';

interface JobCardProps {
  post: Post;
  showExcerpt?: boolean;
}

const getExcerpt = (html: string): string => {
  return stripHtmlToPlainText(html);
};

const getTags = (post: any): string[] => {
  const rawTags = post?.tags;
  if (!rawTags) return [];
  let list: string[] = [];
  if (Array.isArray(rawTags)) {
    list = rawTags.map((t: any) => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string') {
    list = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
  const catSlug = String(post?.category || '').toLowerCase().trim();
  return list.filter(t => t.toLowerCase().trim() !== catSlug).slice(0, 3);
};

export const JobCard = ({ post, showExcerpt = false }: JobCardProps) => {
  const navigate = useNavigate();
  const pAny = post as any;
  
  const companyName = pAny?.company || pAny?.employer || pAny?.organizationName || '';
  const locationText = post?.location || '';
  const rawJobType = pAny?.jobType || pAny?.type || '';
  const VALID_TYPES = ['Full-time', 'Part-time', 'Remote', 'Internship', 'Contract', 'Freelance'];
  const matchedType = VALID_TYPES.find(t => t.toLowerCase() === rawJobType.toLowerCase());
  const jobType = matchedType || rawJobType || '';
  const salaryText = post?.salary || '';

  const tags = getTags(post);
  const excerpt = showExcerpt ? getExcerpt(post.description) : '';

  const handleClick = () => {
    const targetUrl = post.slug ? `/post/${post.slug}` : `/jobs/${post.id}`;
    navigate(targetUrl, { state: { job: post } });
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        backgroundColor: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '2px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      className="hover:border-[#1E3B8B]/30 hover:shadow-sm"
    >
      {/* Title on its OWN full-width line */}
      <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0F172A', lineHeight: '1.4', marginBottom: tags.length > 0 ? '8px' : '12px' }} className="line-clamp-2">
        {post.title}
      </h3>

      {/* Tags below title as small chips (12px, background #F1F5F9, rounded-sm), max 3 */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {tags.map((tag, idx) => (
            <span 
              key={idx}
              style={{
                fontSize: '12px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '2px',
                fontWeight: 500
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Company / Location / Job Type row */}
      {(companyName || locationText || jobType) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          {companyName && (
            <p style={{ fontSize: '14px', color: '#64748b' }} className="line-clamp-1">{companyName}</p>
          )}
          {(locationText || jobType) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              {locationText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} className="shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{locationText}</span>
                </div>
              )}
              {locationText && jobType && <span>•</span>}
              {jobType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={14} className="shrink-0 text-slate-400" />
                  <span className="line-clamp-1">{jobType}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Excerpt if showExcerpt */}
      {showExcerpt && excerpt && (
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }} className="line-clamp-2">
          {excerpt}
        </p>
      )}

      {/* Bottom Row: Salary chip and Easy Apply button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
        {salaryText ? (
          <span style={{ backgroundColor: '#F1F5F9', color: '#1E3B8B', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '2px' }}>
            {salaryText}
          </span>
        ) : <div />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '2px',
            backgroundColor: '#1E3B8B',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
          className="hover:bg-[#162d6e] transition-all"
        >
          Easy Apply
        </button>
      </div>
    </div>
  );
};

export default JobCard;

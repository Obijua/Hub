import React, { useState, useEffect } from 'react';
import { storage, auth } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post, Category } from '../types';
import { X, Upload, Image as ImageIcon, Link as LinkIcon, Check, Tag as TagIcon } from 'lucide-react';
import { createPost, updatePost } from '../lib/posts';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface PostFormProps {
  post: Post | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({ post, onClose, onSuccess }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [description, setDescription] = useState(post?.description || '');
  const [category, setCategory] = useState<Category>(post?.category || 'job');
  const [externalLink, setExternalLink] = useState(post?.externalLink || '');
  const [thumbnail, setThumbnail] = useState(post?.thumbnail || '');
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured || false);
  const [isActive, setIsActive] = useState(post?.isActive ?? true);
  const [deadline, setDeadline] = useState(post?.deadline?.toDate ? post.deadline.toDate().toISOString().split('T')[0] : '');
  const [tags, setTags] = useState<string>(post?.tags?.join(', ') || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const categories: Category[] = [
    'job', 'scholarship', 'free-course', 'udemy-coupon', 'internship', 'opportunity'
  ];

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      let finalThumbnail = thumbnail;

      if (imageFile) {
        const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalThumbnail = await getDownloadURL(snapshot.ref);
      }

      const postData = {
        title,
        slug,
        description,
        category,
        externalLink,
        thumbnail: finalThumbnail,
        isFeatured,
        isActive,
        deadline: deadline ? new Date(deadline) : null,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        authorUid: auth.currentUser.uid,
      };

      if (post) {
        await updatePost(post.id, postData);
      } else {
        await createPost(postData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {post ? 'Edit Opportunity' : 'Create New Opportunity'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Software Engineer Internship at Google"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="software-engineer-internship"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">External Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  required
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://example.com/apply"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tags (comma separated)</label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="remote, tech, internship"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-5 w-5 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="isFeatured" className="text-sm font-bold text-primary">
                  Feature this post on the homepage
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-primary">
                  Published (Visible to public)
                </label>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail Image</label>
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : thumbnail ? (
                    <img src={thumbnail} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">Upload a thumbnail image</p>
                    </>
                  )}
                  <label className="absolute inset-0 cursor-pointer bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white p-2 rounded-full shadow-lg">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Description (Markdown Supported)</label>
          <textarea
            required
            rows={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the opportunity, requirements, and how to apply..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-8 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-900 transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            {post ? 'Update Post' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

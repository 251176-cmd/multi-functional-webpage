import React from 'react';

/**
 * Interface representing a blog post's data structure.
 */
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
}

/**
 * Props for the PostCard component.
 */
export interface PostCardProps {
  post: BlogPost;
}

/**
 * PostCard Component
 *
 * Renders an individual blog post card following a flat Material Design approach (no shadow).
 *
 * @param {PostCardProps} props - The properties for the component containing the post data.
 * @returns {React.JSX.Element} A rendered article element.
 */
export default function PostCard({ post }: PostCardProps) {
  // Purpose: Render a single blog post in a flat card format without shadows.
  // Inputs: post object containing id, title, excerpt, date, author.
  // Output: JSX representing the post card.
  // Side effects: None.
  return (
    <article className="relative group block border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 transition-colors hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {/* Link overlay over the whole card */}
          <a href={`/post/${post.id}`} className="focus:outline-none before:absolute before:inset-0">
            {post.title}
          </a>
        </h2>
        <div className="flex items-center text-sm text-gray-600 font-medium">
          <span>{post.author}</span>
          <span className="mx-2">•</span>
          <time dateTime={post.date}>{post.date}</time>
        </div>
      </div>
      <p className="text-base text-gray-700 leading-relaxed mb-6 line-clamp-3">
        {post.excerpt}
      </p>
      <div className="mt-auto">
        <span className="text-blue-600 font-semibold text-sm tracking-wider uppercase group-hover:underline">
          Read more
        </span>
      </div>
    </article>
  );
}

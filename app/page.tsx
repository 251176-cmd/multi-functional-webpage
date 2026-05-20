import React from 'react';
import PostCard, { BlogPost } from '@/src/components/PostCard';
import Hero from '@/src/components/Hero';
import Link from 'next/link'; // Import Link for internal navigation

// Mock data generator (kept from your original)
function generateMockPosts(): BlogPost[] {
  return [
    {
      id: 1,
      title: 'Getting Started with Next.js App Router',
      excerpt: 'Learn how to build modern web applications using the latest Next.js features.',
      date: 'Mar 11, 2026',
      author: 'Alice Johnson',
    },
    {
      id: 2,
      title: 'The Future of Web Design: Flat Material',
      excerpt: 'Exploring why flat design combined with Material guidelines is becoming the standard.',
      date: 'Mar 10, 2026',
      author: 'Bob Smith',
    },
  ];
}

export default function Home() {
  const posts = generateMockPosts();
  
  return (
    <main className="min-h-screen bg-transparent">
      <Hero
        name="Octavian"
        tagline="I write about building products and learning in public."
        description="Short, practical notes on web development, systems, and the tiny details that make software feel great."
        primaryCta={{ label: 'Read the latest posts', href: '#latest' }}
        secondaryCta={{ label: 'About me', href: '/about' }}
      />

      {/* --- NEW SECTION: MY DOCUMENT WEB --- */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-slate-100 bg-white p-8 transition-colors hover:border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                My Document Web
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Access your personal cloud drive. Upload, rewrite, and manage your documents in one place.
              </p>
            </div>
            <Link 
              href="/documents" 
              className="inline-flex items-center justify-center bg-blue-600 px-6 py-3 text-sm font-bold text-white rounded-2xl hover:bg-blue-700 transition-all shadow-sm active:scale-95"
            >
              Open Drive →
            </Link>
          </div>
        </div>
      </section>
      {/* ------------------------------------ */}

      <section id="latest" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Latest posts
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Fresh writing—focused, skimmable, and built for busy readers.
            </p>
          </div>
          <a
            href="/blog"
            className="hidden sm:inline-flex text-sm font-semibold text-blue-600 hover:underline"
          >
            View all
          </a>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
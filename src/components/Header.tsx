import React from 'react';
import Link from 'next/link';

/**
 * Header Component
 *
 * Renders the top navigation menu. Follows flat Material Design with no shadows.
 */
export default function Header() {
  // Purpose: Provide top-level navigation.
  // Inputs: none.
  // Output: JSX header element.
  // Side effects: none.
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight hover:text-blue-600 transition-colors">
              VC4S
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              About
            </Link>
            <Link href="/game" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              Game
            </Link>
          </nav>

          {/* Mobile Menu Button (simplified) */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

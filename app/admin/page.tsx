'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root Admin Page
 * Handles redirection based on authentication status
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for admin token in localStorage
    const adminToken = localStorage.getItem('adminToken');

    if (adminToken) {
      // If logged in, redirect to dashboard
      router.replace('/admin/dashboard');
    } else {
      // If not logged in, redirect to login page
      router.replace('/admin/login');
    }
  }, [router]);

  // Show nothing while redirecting
  return null;
}


import React from 'react';
import { AdminService } from '@/src/services/admin.service';
import AdminsClient from './AdminsClient';

/**
 * Admin Users Management Page (Server Component)
 * Fetches admin data directly on the server and passes it to the client component.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.searchParams - URL search parameters for pagination
 */
export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  // Await searchParams as required by Next.js 15
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '10');

  let adminsData: Awaited<ReturnType<typeof AdminService.getAdmins>>;
  let error = null;

  try {
    // Execute server-side function directly
    adminsData = await AdminService.getAdmins(page, limit);
  } catch (err: unknown) {
    console.error('[Admin Admins Page] Error fetching admins:', err);
    error = err instanceof Error ? err.message : 'Failed to load admin users';
    adminsData = { admins: [], pages: 0, total: 0 };
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Pass serialized data to Client Component */}
      <AdminsClient 
        admins={JSON.parse(JSON.stringify(adminsData.admins))} 
        totalPages={adminsData.pages} 
        currentPage={page} 
      />
    </div>
  );
}

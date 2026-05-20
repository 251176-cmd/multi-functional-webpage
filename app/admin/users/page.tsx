import React from 'react';
import { UserService } from '@/src/services/user.service';
import UsersClient from './UsersClient';

/**
 * Users Management Page (Server Component)
 * Fetches user data directly on the server and passes it to the client component.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.searchParams - URL search parameters for pagination
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  // Await searchParams as required by Next.js 15
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '10');

  let usersData: Awaited<ReturnType<typeof UserService.getUsers>>;
  let error = null;

  try {
    // Execute server-side function directly
    usersData = await UserService.getUsers(page, limit);
  } catch (err: unknown) {
    console.error('[Admin Users Page] Error fetching users:', err);
    error = err instanceof Error ? err.message : 'Failed to load users';
    usersData = { users: [], pages: 0, total: 0 };
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Pass serialized data to Client Component */}
      <UsersClient 
        users={JSON.parse(JSON.stringify(usersData.users))} 
        totalPages={usersData.pages} 
        currentPage={page} 
      />
    </div>
  );
}

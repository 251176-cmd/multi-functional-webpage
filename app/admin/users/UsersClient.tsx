'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SF_STYLES } from '@/src/lib/constants/styles';
import { Modal } from '@/src/components/admin/Modal';
import { createUserAction, updateUserAction, deleteUserAction } from './actions';

/**
 * User Interface matching the MongoDB model
 */
type UserRole = 'user' | 'admin';

interface User {
  _id: string;
  name?: string;
  email: string;
  isActive: boolean;
  role: UserRole;
  createdAt?: string | Date;
}

interface UsersClientProps {
  users: User[];
  totalPages: number;
  currentPage: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Client Component for Users Management UI
 * Handles modals, state-driven interactions, and pagination navigation.
 */
export default function UsersClient({ users, totalPages, currentPage }: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Add User form state
   */
  const [addFormData, setAddFormData] = useState<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true,
  });

  /**
   * Edit User form state
   */
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    isActive: boolean;
  }>({
    name: '',
    email: '',
    isActive: true,
  });

  // State for Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles pagination by updating URL search parameters
   * @param pageNumber The new page number
   */
  const handlePageChange = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    router.push(`?${params.toString()}`);
  };

  /**
   * Opens the add user modal and resets the form
   */
  const handleAddClick = () => {
    setAddFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      isActive: true,
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  /**
   * Handles user creation submission using Server Actions
   */
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await createUserAction(addFormData);

      if (result.success) {
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Opens the edit modal and populates it with user data
   * @param user The user to edit
   */
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email,
      isActive: user.isActive,
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  /**
   * Opens the delete confirmation modal
   * @param user The user to delete
   */
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handles user update submission using Server Actions
   */
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await updateUserAction(selectedUser._id, {
        name: editFormData.name,
        email: editFormData.email,
        isActive: editFormData.isActive,
      });

      if (result.success) {
        setIsEditModalOpen(false);
        router.refresh(); // Refresh the page to show new data
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles user deletion using Server Actions
   */
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await deleteUserAction(selectedUser._id);

      if (result.success) {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        router.refresh(); // Refresh the page to show new data
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button 
          onClick={handleAddClick}
          className={SF_STYLES.button.primary}
        >
          + Add User
        </button>
      </div>

      <div className={SF_STYLES.card.base}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: SF_STYLES.colors.border }}>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Name</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Email</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Status</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: SF_STYLES.colors.border }}>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-[#747474]">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-[#F3F3F3] transition-colors">
                    <td className="py-4 text-sm font-medium">{user.name || 'N/A'}</td>
                    <td className="py-4 text-sm">{user.email}</td>
                    <td className="py-4 text-sm">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                        user.isActive 
                          ? 'bg-[#D8F0E5] text-[#2E844A]' 
                          : 'bg-[#F3F3F3] text-[#747474]'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-sm">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="text-[#0176D3] hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="text-[#EA001E] hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t" style={{ borderColor: SF_STYLES.colors.border }}>
            <span className="text-sm text-[#747474]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`${SF_STYLES.button.secondary} py-1 px-3 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`${SF_STYLES.button.secondary} py-1 px-3 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update User Details"
        footer={
          <>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className={SF_STYLES.button.secondary}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdateUser}
              className={SF_STYLES.button.primary}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Full Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className={SF_STYLES.input.base}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Email Address</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className={SF_STYLES.input.base}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Account Status</label>
            <select
              value={editFormData.isActive ? 'Active' : 'Inactive'}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'Active' })}
              className={SF_STYLES.input.base}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        footer={
          <>
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className={SF_STYLES.button.secondary}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete}
              className="bg-[#EA001E] hover:bg-[#B00017] text-white font-medium py-2 px-4 rounded-[4px] transition-colors shadow-sm text-sm disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete User'}
            </button>
          </>
        }
      >
        <div className="text-[#080707]">
          <p className="mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
          <div className="p-4 bg-[#F3F3F3] rounded-[4px] border border-[#DDDBDA]">
            <p className="text-sm font-semibold">{selectedUser?.name || 'N/A'}</p>
            <p className="text-xs text-[#444444]">{selectedUser?.email}</p>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isSubmitting={isSubmitting}
        formData={addFormData}
        setFormData={setAddFormData}
        onSubmit={handleAddUser}
      />
    </div>
  );
}

/**
 * Add User Modal Component
 */
function AddUserModal({
  isOpen,
  onClose,
  isSubmitting,
  formData,
  setFormData,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  formData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
  };
  setFormData: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
      footer={
        <>
          <button 
            onClick={onClose}
            className={SF_STYLES.button.secondary}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            className={SF_STYLES.button.primary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#444444]">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={SF_STYLES.input.base}
            placeholder="e.g. John Doe"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#444444]">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={SF_STYLES.input.base}
            placeholder="e.g. john@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#444444]">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={SF_STYLES.input.base}
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Role</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value === 'admin' ? 'admin' : 'user',
                })
              }
              className={SF_STYLES.input.base}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Account Status</label>
            <select
              value={formData.isActive ? 'Active' : 'Inactive'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}
              className={SF_STYLES.input.base}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}


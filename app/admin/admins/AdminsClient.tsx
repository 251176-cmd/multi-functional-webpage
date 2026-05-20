'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SF_STYLES } from '@/src/lib/constants/styles';
import { Modal } from '@/src/components/admin/Modal';
import { createAdminAction, updateAdminAction, deleteAdminAction } from './actions';

/**
 * Admin User Interface matching the MongoDB model
 */
interface Admin {
  _id: string;
  name: string;
  email: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt?: string | Date;
}

interface AdminsClientProps {
  admins: Admin[];
  totalPages: number;
  currentPage: number;
}

type AddAdminFormData = {
  name: string;
  email: string;
  password: string;
  permissions: string[];
  isActive: boolean;
};

type EditAdminFormData = {
  name: string;
  email: string;
  permissions: string[];
  isActive: boolean;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Client Component for Admin Users Management UI
 */
export default function AdminsClient({ admins, totalPages, currentPage }: AdminsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addFormData, setAddFormData] = useState<AddAdminFormData>({
    name: '',
    email: '',
    password: '',
    permissions: ['all'],
    isActive: true,
  });

  const [editFormData, setEditFormData] = useState<EditAdminFormData>({
    name: '',
    email: '',
    permissions: ['all'],
    isActive: true,
  });

  /**
   * Handles pagination
   */
  const handlePageChange = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    router.push(`?${params.toString()}`);
  };

  /**
   * Opens the add admin modal
   */
  const handleAddClick = () => {
    setAddFormData({
      name: '',
      email: '',
      password: '',
      permissions: ['all'],
      isActive: true,
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  /**
   * Handles admin creation submission
   */
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await createAdminAction(addFormData);
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
   * Opens the edit modal
   */
  const handleEditClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name,
      email: admin.email,
      permissions: admin.permissions,
      isActive: admin.isActive,
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  /**
   * Handles admin update submission
   */
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await updateAdminAction(selectedAdmin._id, editFormData);
      if (result.success) {
        setIsEditModalOpen(false);
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
   * Opens the delete modal
   */
  const handleDeleteClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handles admin deletion
   */
  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await deleteAdminAction(selectedAdmin._id);
      if (result.success) {
        setIsDeleteModalOpen(false);
        setSelectedAdmin(null);
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

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <button 
          onClick={handleAddClick}
          className={SF_STYLES.button.primary}
        >
          + Add Admin
        </button>
      </div>

      <div className={SF_STYLES.card.base}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: SF_STYLES.colors.border }}>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Admin Name</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Email</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Permissions</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Status</th>
                <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: SF_STYLES.colors.border }}>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#747474]">No admins found.</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-[#F3F3F3] transition-colors">
                    <td className="py-4 text-sm font-medium">{admin.name}</td>
                    <td className="py-4 text-sm">{admin.email}</td>
                    <td className="py-4 text-sm">
                      {admin.permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-blue-50 text-[#0078d4] text-[10px] font-bold uppercase rounded mr-1">
                          {p === 'all' ? 'Full Access' : p}
                        </span>
                      ))}
                    </td>
                    <td className="py-4 text-sm">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                        admin.isActive 
                          ? 'bg-[#D8F0E5] text-[#2E844A]' 
                          : 'bg-[#F3F3F3] text-[#747474]'
                      }`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-sm">
                      <button 
                        onClick={() => handleEditClick(admin)}
                        className="text-[#0176D3] hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(admin)}
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

        {/* Pagination */}
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

      {/* Add Admin Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Admin"
        isSubmitting={isSubmitting}
        formData={addFormData}
        setFormData={setAddFormData}
        onSubmit={handleAddAdmin}
        isEdit={false}
      />

      {/* Edit Admin Modal */}
      <AdminModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Admin Details"
        isSubmitting={isSubmitting}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdateAdmin}
        isEdit={true}
      />

      {/* Delete Admin Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Admin"
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
              {isSubmitting ? 'Deleting...' : 'Delete Admin'}
            </button>
          </>
        }
      >
        <div className="text-[#080707]">
          <p className="mb-4">Are you sure you want to delete this admin? This action cannot be undone.</p>
          <div className="p-4 bg-[#F3F3F3] rounded-[4px] border border-[#DDDBDA]">
            <p className="text-sm font-semibold">{selectedAdmin?.name}</p>
            <p className="text-xs text-[#444444]">{selectedAdmin?.email}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Shared Admin Modal Component
 */
type AdminModalProps =
  | {
      isOpen: boolean;
      onClose: () => void;
      title: string;
      isSubmitting: boolean;
      formData: AddAdminFormData;
      setFormData: React.Dispatch<React.SetStateAction<AddAdminFormData>>;
      onSubmit: (e: React.FormEvent) => void;
      isEdit: false;
    }
  | {
      isOpen: boolean;
      onClose: () => void;
      title: string;
      isSubmitting: boolean;
      formData: EditAdminFormData;
      setFormData: React.Dispatch<React.SetStateAction<EditAdminFormData>>;
      onSubmit: (e: React.FormEvent) => void;
      isEdit: true;
    };

function AdminModal({
  isOpen,
  onClose,
  title,
  isSubmitting,
  formData,
  setFormData,
  onSubmit,
  isEdit,
}: AdminModalProps) {
  if (isEdit) {
    const editData = formData;
    const setEditData = setFormData;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
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
              {isSubmitting ? "Updating..." : "Update Admin"}
            </button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">
              Full Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              className={SF_STYLES.input.base}
              placeholder="e.g. Admin User"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">
              Email Address
            </label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) =>
                setEditData({ ...editData, email: e.target.value })
              }
              className={SF_STYLES.input.base}
              placeholder="e.g. admin@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#444444]">
                Status
              </label>
              <select
                value={editData.isActive ? "Active" : "Inactive"}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    isActive: e.target.value === "Active",
                  })
                }
                className={SF_STYLES.input.base}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#444444]">
                Permissions
              </label>
              <select
                value={editData.permissions[0]}
                onChange={(e) =>
                  setEditData({ ...editData, permissions: [e.target.value] })
                }
                className={SF_STYLES.input.base}
              >
                <option value="all">Full Access</option>
                <option value="read-only">Read Only</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    );
  }

  const addData = formData;
  const setAddData = setFormData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
            {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Admin' : 'Create Admin')}
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#444444]">Full Name</label>
          <input
            type="text"
            value={addData.name}
            onChange={(e) => setAddData({ ...addData, name: e.target.value })}
            className={SF_STYLES.input.base}
            placeholder="e.g. Admin User"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#444444]">Email Address</label>
          <input
            type="email"
            value={addData.email}
            onChange={(e) => setAddData({ ...addData, email: e.target.value })}
            className={SF_STYLES.input.base}
            placeholder="e.g. admin@example.com"
            required
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Password</label>
            <input
              type="password"
              value={addData.password}
              onChange={(e) => setAddData({ ...addData, password: e.target.value })}
              className={SF_STYLES.input.base}
              placeholder="Min. 10 characters"
              required={!isEdit}
              minLength={10}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Status</label>
            <select
              value={addData.isActive ? 'Active' : 'Inactive'}
              onChange={(e) => setAddData({ ...addData, isActive: e.target.value === 'Active' })}
              className={SF_STYLES.input.base}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#444444]">Permissions</label>
            <select
              value={addData.permissions[0]}
              onChange={(e) => setAddData({ ...addData, permissions: [e.target.value] })}
              className={SF_STYLES.input.base}
            >
              <option value="all">Full Access</option>
              <option value="read-only">Read Only</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}


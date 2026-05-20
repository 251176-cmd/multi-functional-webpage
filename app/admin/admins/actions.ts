'use server';

import { AdminService } from '@/src/services/admin.service';
import { revalidatePath } from 'next/cache';
import { AdminUser } from '@/src/models/admin-user';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * Server Action to create a new admin.
 * 
 * @param {Partial<AdminUser> & { password?: string }} data - The admin data to create.
 * @returns {Promise<{ success: boolean; message: string; adminId?: string }>}
 */
export async function createAdminAction(data: Partial<AdminUser> & { password?: string }) {
  try {
    const adminId = await AdminService.createAdmin(data);
    revalidatePath('/admin/admins');
    return { success: true, message: 'Admin created successfully', adminId };
  } catch (error: unknown) {
    console.error('[Admin Actions] Create error:', error);
    return { success: false, message: getErrorMessage(error) };
  }
}

/**
 * Server Action to update an admin.
 * 
 * @param {string} adminId - The ID of the admin to update.
 * @param {Partial<AdminUser>} data - The updated admin data.
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function updateAdminAction(adminId: string, data: Partial<AdminUser>) {
  try {
    const success = await AdminService.updateAdmin(adminId, data);
    if (success) {
      revalidatePath('/admin/admins');
      return { success: true, message: 'Admin updated successfully' };
    }
    return { success: false, message: 'Failed to update admin' };
  } catch (error: unknown) {
    console.error('[Admin Actions] Update error:', error);
    return { success: false, message: getErrorMessage(error) };
  }
}

/**
 * Server Action to delete an admin.
 * 
 * @param {string} adminId - The ID of the admin to delete.
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteAdminAction(adminId: string) {
  try {
    const success = await AdminService.deleteAdmin(adminId);
    if (success) {
      revalidatePath('/admin/admins');
      return { success: true, message: 'Admin deleted successfully' };
    }
    return { success: false, message: 'Failed to delete admin' };
  } catch (error: unknown) {
    console.error('[Admin Actions] Delete error:', error);
    return { success: false, message: getErrorMessage(error) };
  }
}


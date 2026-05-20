'use server';

import { UserService } from '@/src/services/user.service';
import { revalidatePath } from 'next/cache';
import { User } from '@/src/models/user';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * Server Action to create a new user.
 * 
 * @param {Partial<User> & { password?: string }} data - The user data to create.
 * @returns {Promise<{ success: boolean; message: string; userId?: string }>}
 */
export async function createUserAction(data: Partial<User> & { password?: string }) {
  try {
    const userId = await UserService.createUser(data);
    // Revalidate the users page to show updated data
    revalidatePath('/admin/users');
    return { success: true, message: 'User created successfully', userId };
  } catch (error: unknown) {
    console.error('[User Actions] Create error:', error);
    return { success: false, message: getErrorMessage(error) };
  }
}

/**
 * Server Action to update a user.
 * 
 * @param {string} userId - The ID of the user to update.
 * @param {Partial<User>} data - The updated user data.
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function updateUserAction(userId: string, data: Partial<User>) {
  try {
    const success = await UserService.updateUser(userId, data);
    if (success) {
      // Revalidate the users page to show updated data
      revalidatePath('/admin/users');
      return { success: true, message: 'User updated successfully' };
    }
    return { success: false, message: 'Failed to update user' };
  } catch (error: unknown) {
    console.error('[User Actions] Update error:', error);
    return { success: false, message: getErrorMessage(error) };
  }
}

/**
 * Server Action to delete a user.
 * 
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteUserAction(userId: string) {
  try {
    const success = await UserService.deleteUser(userId);
    if (success) {
      // Revalidate the users page to show updated data
      revalidatePath('/admin/users');
      return { success: true, message: 'User deleted successfully' };
    }
    return { success: false, message: 'Failed to delete user' };
  } catch (error: unknown) {
    console.error('[User Actions] Delete error:', error);
    return { success: false, message: getErrorMessage(error) };
  }
}


'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SF_STYLES } from '@/src/lib/constants/styles';
import { motion } from 'framer-motion';

// --- SVG Icons ---

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

/**
 * Sidebar component for the Admin Portal
 * Uses Salesforce Lightning Design System (SLDS) inspired design
 */
export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { name: 'Users', path: '/admin/users', icon: <UsersIcon /> },
    { name: 'Admin Users', path: '/admin/admins', icon: <ShieldIcon /> },
    { name: 'System Setting', path: '/admin/system-settings', icon: <SettingsIcon /> },
  ];

  const handleLogout = () => {
    // Basic logout logic - clear token and redirect
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <div 
      className="fixed left-0 top-0 h-screen flex flex-col border-r"
      style={{ 
        width: SF_STYLES.sidebarWidth, 
        backgroundColor: SF_STYLES.sidebar.bg,
        borderColor: SF_STYLES.colors.border 
      }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center px-6" style={{ height: '64px' }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: SF_STYLES.colors.primary }}>
          VC4S Starter Template
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link 
                href={item.path}
                className={`flex items-center px-4 py-2.5 mb-1 rounded-[4px] text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#F3F3F3]' : 'hover:bg-[#F3F3F3]'
                }`}
                style={{ 
                  color: isActive ? SF_STYLES.colors.primary : SF_STYLES.sidebar.itemText,
                  borderLeft: isActive ? `3px solid ${SF_STYLES.colors.primary}` : '3px solid transparent'
                }}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t" style={{ borderColor: SF_STYLES.colors.border }}>
        <motion.button
          whileHover={{ x: 4 }}
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 rounded-[4px] text-sm font-medium text-[#EA001E] hover:bg-[#F3F3F3] transition-colors"
        >
          <span className="mr-3"><LogoutIcon /></span>
          Logout
        </motion.button>
      </div>
    </div>
  );
};


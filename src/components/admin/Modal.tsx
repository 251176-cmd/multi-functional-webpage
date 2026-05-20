'use client';

import React, { useEffect } from 'react';
import { SF_STYLES } from '@/src/lib/constants/styles';

/**
 * Modal Props
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Generic Modal Component for Admin Portal
 * Follows Salesforce Lightning Design System (SLDS) aesthetics
 */
export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer 
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-[#F3F3F3]" style={{ borderColor: SF_STYLES.colors.border }}>
          <h2 className="text-lg font-bold text-[#080707]">{title}</h2>
          <button 
            onClick={onClose}
            className="text-[#747474] hover:text-[#080707] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t flex justify-end gap-3 bg-[#F3F3F3]" style={{ borderColor: SF_STYLES.colors.border }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};


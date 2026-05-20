/**
 * Salesforce Lightning Design System (SLDS) inspired design constants
 * Centralized styling for the Admin Portal
 */
export const SF_STYLES = {
  // Colors
  colors: {
    primary: '#0176D3',       // Salesforce Blue
    primaryHover: '#014486',
    background: '#F3F3F3',    // Light Background
    surface: '#ffffff',       // White surface
    border: '#DDDBDA',        // Neutral Border
    textPrimary: '#080707',   // Dark Text
    textSecondary: '#444444', // Gray Text
    error: '#EA001E',         // Salesforce Red
    success: '#2E844A',       // Salesforce Green
  },

  // Layout
  sidebarWidth: '240px',
  headerHeight: '56px',

  // Shadows
  shadows: {
    small: '0 2px 2px 0 rgba(0, 0, 0, 0.1)',
    medium: '0 4px 4px 0 rgba(0, 0, 0, 0.16)',
    large: '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
  },

  // Radius
  radius: {
    small: '2px',
    medium: '4px',
    large: '8px',
  },

  // Component Specific
  sidebar: {
    bg: '#ffffff',
    itemHover: '#F3F3F3',
    itemActive: '#E0E5EE',
    itemText: '#080707',
    itemIcon: '#747474',
    activeBorder: '#0176D3',
  },
  
  button: {
    primary: 'bg-[#0176D3] hover:bg-[#014486] text-white font-medium py-2 px-4 rounded-[4px] transition-colors shadow-sm text-sm',
    secondary: 'bg-white hover:bg-[#F3F3F3] text-[#0176D3] border border-[#DDDBDA] font-medium py-2 px-4 rounded-[4px] transition-colors text-sm',
  },

  input: {
    base: 'w-full px-3 py-2 border border-[#DDDBDA] rounded-[4px] focus:outline-none focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3] placeholder-[#747474] bg-white transition-all text-sm text-[#080707]',
  },

  card: {
    base: 'bg-white border border-[#DDDBDA] p-6 rounded-[4px] shadow-sm text-[#080707]',
  }
};


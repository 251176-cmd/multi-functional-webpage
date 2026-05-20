'use client';

import React from 'react';
import { SF_STYLES } from '@/src/lib/constants/styles';
import { motion } from 'framer-motion';

/**
 * Interface for system status items
 */
interface SystemItem {
  name: string;
  value: string;
}

/**
 * Interface for environment variable items
 */
interface EnvVarItem {
  name: string;
  value: string;
  isSensitive: boolean;
}

/**
 * Props for SystemSettingsClient component
 */
interface SystemSettingsClientProps {
  systemStatus: SystemItem[];
  envVars: EnvVarItem[];
}

/**
 * Animation variants for the sections
 */
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
};

/**
 * Animation variants for table rows
 */
const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    }
  })
};

/**
 * Client Component for System Settings UI
 * Displays system status and environment variables in SLDS-styled tables.
 */
export default function SystemSettingsClient({ systemStatus, envVars }: SystemSettingsClientProps) {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold">System Settings</h1>
      </motion.div>

      {/* System Status Section */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold text-[#080707]">System Status</h2>
        <div className={SF_STYLES.card.base}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: SF_STYLES.colors.border }}>
                  <th className="pb-3 text-xs font-semibold uppercase text-[#444444] w-1/3">Property</th>
                  <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: SF_STYLES.colors.border }}>
                {systemStatus.map((item, index) => (
                  <motion.tr 
                    key={index}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={rowVariants}
                    className="hover:bg-[#F3F3F3] transition-colors"
                  >
                    <td className="py-4 text-sm font-medium">{item.name}</td>
                    <td className="py-4 text-sm font-mono text-[#444444]">{item.value}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Environment Variables Section */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold text-[#080707]">Environment Variables</h2>
        <div className={SF_STYLES.card.base}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: SF_STYLES.colors.border }}>
                  <th className="pb-3 text-xs font-semibold uppercase text-[#444444] w-1/3">Variable Name</th>
                  <th className="pb-3 text-xs font-semibold uppercase text-[#444444]">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: SF_STYLES.colors.border }}>
                {envVars.map((item, index) => (
                  <motion.tr 
                    key={index}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={rowVariants}
                    className="hover:bg-[#F3F3F3] transition-colors"
                  >
                    <td className="py-4 text-sm font-medium">{item.name}</td>
                    <td className={`py-4 text-sm font-mono ${item.isSensitive ? 'text-red-600 italic' : 'text-[#444444]'}`}>
                      {item.value}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


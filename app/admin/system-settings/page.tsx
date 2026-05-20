import React from 'react';
import os from 'os';
import SystemSettingsClient from './SystemSettingsClient';

/**
 * System Settings Page (Server Component)
 * Collects system status and environment information to display in the admin panel.
 */
export default async function SystemSettingsPage() {
  // Collect System Status
  const systemStatus = [
    { name: 'Node.js Version', value: process.version },
    { name: 'Platform', value: process.platform },
    { name: 'Architecture', value: process.arch },
    { name: 'CPU Cores', value: os.cpus().length.toString() },
    { name: 'Total Memory', value: `${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB` },
    { name: 'Free Memory', value: `${(os.freemem() / (1024 * 1024 * 1024)).toFixed(2)} GB` },
    { name: 'System Uptime', value: `${(os.uptime() / 3600).toFixed(2)} hours` },
    { name: 'Hostname', value: os.hostname() },
  ];

  // Collect Environment Variables (filtering for non-sensitive ones or masking)
  const envVars = Object.entries(process.env).map(([key, value]) => {
    // Mask sensitive information
    const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'AUTH', 'DB_URI', 'MONGODB_URI'];
    const isSensitive = sensitiveKeys.some(sk => key.toUpperCase().includes(sk));
    
    return {
      name: key,
      value: isSensitive ? '********' : (value || 'N/A'),
      isSensitive
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-6">
      <SystemSettingsClient 
        systemStatus={systemStatus} 
        envVars={envVars} 
      />
    </div>
  );
}


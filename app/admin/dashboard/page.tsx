'use client';

import React from 'react';
import { SF_STYLES } from '@/src/lib/constants/styles';

/**
 * Admin Dashboard Page
 */
export default function DashboardPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className={SF_STYLES.card.base}>
          <p className="text-xs font-semibold text-[#444444] uppercase">Total Users</p>
          <p className="text-3xl font-bold mt-2">1,248</p>
        </div>
        <div className={SF_STYLES.card.base}>
          <p className="text-xs font-semibold text-[#444444] uppercase">Active Sessions</p>
          <p className="text-3xl font-bold mt-2">42</p>
        </div>
        <div className={SF_STYLES.card.base}>
          <p className="text-xs font-semibold text-[#444444] uppercase">Database Health</p>
          <p className="text-3xl font-bold mt-2 text-[#2E844A]">Optimal</p>
        </div>
      </div>

      <div className={`mt-8 ${SF_STYLES.card.base}`}>
        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <p className="text-sm text-[#444444]">
          Welcome to the VC4S Starter Template. Use the sidebar to manage users and view system logs.
        </p>
      </div>
    </div>
  );
}


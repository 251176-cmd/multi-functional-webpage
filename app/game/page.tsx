import type { Metadata } from 'next';
import GameClient from './GameClient';

export const metadata: Metadata = {
  title: 'Arena Shooter · VC4S',
  description: 'Mongo-backed multiplayer co-op arena with AI drones.',
};

/**
 * Server shell for the game route; gameplay runs entirely in `GameClient`.
 */
export default function GamePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <GameClient />
    </main>
  );
}

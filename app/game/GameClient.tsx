'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { GameStateResponse } from '@/src/models/gameArena';
import { ARENA_HEIGHT, ARENA_WIDTH } from '@/src/lib/game/constants';

type KeysHeld = { w: boolean; a: boolean; s: boolean; d: boolean };

const STORAGE_NAME = 'vc4s_game_display_name';
const ROOM_ID = 'main';
const SYNC_MS = 45;

/**
 * Calls a Next.js game API route and parses JSON.
 * HTML responses usually mean the request never reached Next.js API routes (static preview / wrong server).
 */
async function fetchGameApi(path: string, init: RequestInit): Promise<{ response: Response; body: unknown }> {
  const url = typeof window !== 'undefined' ? new URL(path, window.location.origin).href : path;
  const response = await fetch(url, init);
  const text = await response.text();
  const trimmedStart = text.trimStart();
  if (trimmedStart.startsWith('<')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    throw new Error(
      [
        `The server returned HTML instead of JSON (HTTP ${response.status}).`,
        `Run this project with "npm run dev", then open ${origin}/game`,
        `in that server. Static file hosts and many IDE previews cannot call /api/game/*.`,
      ].join(' '),
    );
  }
  let body: unknown;
  try {
    body = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new Error(`Game API returned invalid JSON (HTTP ${response.status}).`);
  }
  return { response, body };
}

/**
 * Client-side canvas renderer and input loop for the Mongo-backed arena.
 * Repeatedly POSTs `/api/game/sync` so all players share the same authoritative simulation.
 */
export default function GameClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const latestStateRef = useRef<GameStateResponse | null>(null);
  const keysRef = useRef<KeysHeld>({ w: false, a: false, s: false, d: false });
  const mouseRef = useRef({ x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2, down: false });
  const wantsShootRef = useRef(false);

  const [displayName, setDisplayName] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [hud, setHud] = useState({ hp: 0, score: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_NAME);
    if (saved) setDisplayName(saved);
  }, []);

  /** Maps pointer position to arena coordinates for aiming. */
  const updateMouseFromEvent = useCallback((clientX: number, clientY: number, isDown: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;
    mouseRef.current = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      down: isDown,
    };
  }, []);

  /** Joins the shared MongoDB-backed room and stores the assigned `playerId`. */
  const handleJoin = async () => {
    setJoinError(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setJoinError('Please enter a call sign.');
      return;
    }
    try {
      const { response: res, body: data } = await fetchGameApi('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: ROOM_ID, displayName: trimmed }),
      });
      if (!res.ok || typeof data !== 'object' || data === null || !('playerId' in data) || !('state' in data)) {
        const message =
          typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string'
            ? (data as { message: string }).message
            : 'Could not join the arena.';
        throw new Error(message);
      }
      playerIdRef.current = String((data as { playerId: string }).playerId);
      const initialState = (data as { state: GameStateResponse }).state;
      latestStateRef.current = initialState;
      const me = initialState.players.find((p) => p.id === playerIdRef.current);
      if (me) setHud({ hp: me.hp, score: me.score });
      window.localStorage.setItem(STORAGE_NAME, trimmed);
      setJoined(true);
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : 'Join failed');
    }
  };

  /** Draws the latest authoritative snapshot onto the canvas. */
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const state = latestStateRef.current;
    const selfId = playerIdRef.current;
    if (!canvas || !ctx || !state || !selfId) return;

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= ARENA_WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
      ctx.stroke();
    }

    for (const b of state.bullets) {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const npc of state.npcs) {
      if (npc.hp <= 0) continue;
      ctx.fillStyle = '#fb7185';
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (const p of state.players) {
      const isSelf = p.id === selfId;
      ctx.fillStyle = isSelf ? '#4ade80' : '#38bdf8';
      ctx.strokeStyle = isSelf ? '#14532d' : '#0c4a6e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const dirLen = 22;
      ctx.strokeStyle = isSelf ? '#bbf7d0' : '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * dirLen, p.y + Math.sin(p.angle) * dirLen);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px var(--font-geist-sans, sans-serif)';
      ctx.fillText(p.name, p.x - 22, p.y - 22);
    }
  }, []);

  useEffect(() => {
    if (!joined) return;

    let cancelled = false;
    let raf = 0;

    const pump = () => {
      renderFrame();
      raf = requestAnimationFrame(pump);
    };
    pump();

    const syncLoop = window.setInterval(async () => {
      const id = playerIdRef.current;
      if (!id || cancelled) return;
      const k = keysRef.current;
      const moveX = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      const moveY = (k.s ? 1 : 0) - (k.w ? 1 : 0);
      const m = mouseRef.current;
      const self = latestStateRef.current?.players.find((p) => p.id === id);
      const originX = self?.x ?? ARENA_WIDTH / 2;
      const originY = self?.y ?? ARENA_HEIGHT / 2;
      const aimAngle = Math.atan2(m.y - originY, m.x - originX);

      try {
        const { response: res, body: payload } = await fetchGameApi('/api/game/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: ROOM_ID,
            playerId: id,
            moveX,
            moveY,
            aimAngle,
            wantsShoot: wantsShootRef.current,
          }),
        });
        if (!res.ok) {
          console.warn('[Game] sync failed', payload);
          return;
        }
        if (typeof payload === 'object' && payload !== null && 'state' in payload) {
          const next = (payload as { state: GameStateResponse }).state;
          latestStateRef.current = next;
          const me = next.players.find((p) => p.id === id);
          if (me) setHud({ hp: me.hp, score: me.score });
        }
      } catch (e) {
        console.warn('[Game] sync error', e);
      } finally {
        wantsShootRef.current = false;
      }
    }, SYNC_MS);

    return () => {
      cancelled = true;
      clearInterval(syncLoop);
      cancelAnimationFrame(raf);
    };
  }, [joined, renderFrame]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = true;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = true;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = true;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = false;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = false;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = false;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  if (!joined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Co-op Arena</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Multiplayer top-down room backed by MongoDB. NPC drones hunt players; green is you, blue are allies, red are
          bots. WASD to move, mouse to aim, click to fire.
        </p>
        <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Use <span className="font-mono">npm run dev</span> and open this site from that server (e.g.{' '}
          <span className="font-mono">http://localhost:3000/game</span>). Opening only the HTML file or a static preview
          cannot reach <span className="font-mono">/api/game/*</span>.
        </p>
        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <label className="block text-sm font-semibold text-slate-800" htmlFor="callsign">
            Call sign
          </label>
          <input
            id="callsign"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500/25 focus:ring-4"
            placeholder="Commander"
            maxLength={24}
          />
          {joinError ? <p className="text-sm text-red-600">{joinError}</p> : null}
          <button
            type="button"
            onClick={() => void handleJoin()}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Enter arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Arena Shooter</h1>
          <p className="text-sm text-slate-600">
            Room <span className="font-mono text-slate-800">{ROOM_ID}</span> — state synced via MongoDB
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
          <div>
            HP: <span className="font-semibold tabular-nums">{hud.hp}</span>
          </div>
          <div>
            Score: <span className="font-semibold tabular-nums">{hud.score}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-3 shadow-xl">
        <canvas
          ref={canvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          className="h-auto w-full max-h-[70vh] cursor-crosshair rounded-lg"
          onMouseMove={(e) => updateMouseFromEvent(e.clientX, e.clientY, mouseRef.current.down)}
          onMouseDown={(e) => {
            updateMouseFromEvent(e.clientX, e.clientY, true);
            wantsShootRef.current = true;
          }}
          onMouseUp={(e) => updateMouseFromEvent(e.clientX, e.clientY, false)}
          onMouseLeave={(e) => updateMouseFromEvent(e.clientX, e.clientY, false)}
        />
        <p className="mt-2 text-center text-xs text-slate-400">
          Tip: open a second browser window with a different call sign to see multiplayer.
        </p>
      </div>
    </div>
  );
}

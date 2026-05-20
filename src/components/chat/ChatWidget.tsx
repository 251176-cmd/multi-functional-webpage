"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const ROOM_STORAGE_KEY = "vc4s.chatroom.v1";
const ROOM_DEFAULT = "lobby";

type ChatRoomMessage = {
  id: string;
  roomId: string;
  clientId: string;
  displayName: string;
  text: string;
  createdAt: number;
};

type ChatRoomGetResponse = {
  messages: ChatRoomMessage[];
};

type ChatRoomPostResponse = { message: ChatRoomMessage };

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createClientId(): string {
  if (typeof crypto === "undefined" || !("getRandomValues" in crypto)) {
    return `client_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `client_${hex}`;
}

function defaultDisplayName(): string {
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `Guest-${suffix}`;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function fetchRoomMessages(params: {
  roomId: string;
  after?: number;
  signal: AbortSignal;
}): Promise<ChatRoomGetResponse> {
  const url = new URL("/api/chatroom/messages", window.location.origin);
  url.searchParams.set("room", params.roomId);
  if (typeof params.after === "number") url.searchParams.set("after", String(params.after));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "content-type": "application/json" },
    signal: params.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to load room messages");
  }

  return (await response.json()) as ChatRoomGetResponse;
}

async function postRoomMessage(params: {
  roomId: string;
  clientId: string;
  displayName: string;
  text: string;
  signal: AbortSignal;
}): Promise<ChatRoomPostResponse> {
  const response = await fetch("/api/chatroom/messages", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      roomId: params.roomId,
      clientId: params.clientId,
      displayName: params.displayName,
      text: params.text,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to send room message");
  }

  return (await response.json()) as ChatRoomPostResponse;
}

/**
 * NEW: API call to delete messages from the database
 */
async function deleteRoomMessages(params: {
  roomId: string;
  signal?: AbortSignal;
}): Promise<void> {
  const url = new URL("/api/chatroom/messages", window.location.origin);
  url.searchParams.set("room", params.roomId);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    signal: params.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to clear room history");
  }
}

export default function ChatWidget(): React.JSX.Element {
  const shouldReduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [input, setInput] = React.useState<string>("");
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [roomId] = React.useState<string>(ROOM_DEFAULT);
  const [roomMessages, setRoomMessages] = React.useState<ChatRoomMessage[]>([]);
  const [clientId, setClientId] = React.useState<string>("");
  const [displayName, setDisplayName] = React.useState<string>("");
  const [statusText, setStatusText] = React.useState<string>("Connecting…");

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const roomAbortRef = React.useRef<AbortController | null>(null);
  const roomPollRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (raw) {
      const restored = safeJsonParse<{ clientId: string; displayName: string }>(raw);
      if (restored?.clientId && restored.displayName) {
        setClientId(restored.clientId);
        setDisplayName(restored.displayName);
        return;
      }
    }

    const nextClientId = createClientId();
    const nextName = defaultDisplayName();
    setClientId(nextClientId);
    setDisplayName(nextName);
    localStorage.setItem(
      ROOM_STORAGE_KEY,
      JSON.stringify({ clientId: nextClientId, displayName: nextName }),
    );
  }, []);

  React.useEffect(() => {
    if (!clientId || !displayName) return;
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify({ clientId, displayName }));
  }, [clientId, displayName]);

  React.useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isOpen, roomMessages.length]);

  React.useEffect(() => {
    if (!isOpen) {
      roomAbortRef.current?.abort();
      roomAbortRef.current = null;
      if (roomPollRef.current) {
        window.clearInterval(roomPollRef.current);
        roomPollRef.current = null;
      }
      return;
    }

    if (!clientId || !displayName) {
      setStatusText("Connecting…");
      return;
    }

    const poll = async (signal: AbortSignal) => {
      const after = roomMessages.length ? roomMessages[roomMessages.length - 1]?.createdAt : undefined;
      const data = await fetchRoomMessages({ roomId, after, signal });
      setStatusText("Online");
      if (data.messages.length) {
        setRoomMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of data.messages) {
            if (!seen.has(m.id)) merged.push(m);
          }
          merged.sort((a, b) => a.createdAt - b.createdAt);
          return merged.slice(-300);
        });
      }
    };

    roomAbortRef.current?.abort();
    const controller = new AbortController();
    roomAbortRef.current = controller;

    setStatusText("Connecting…");
    void poll(controller.signal).catch(() => setStatusText("Offline"));

    roomPollRef.current = window.setInterval(() => {
      void poll(controller.signal).catch(() => setStatusText("Offline"));
    }, 1200);

    return () => {
      controller.abort();
      if (roomPollRef.current) {
        window.clearInterval(roomPollRef.current);
        roomPollRef.current = null;
      }
    };
  }, [isOpen, roomId, clientId, displayName, roomMessages.length]);

  /**
   * UPDATED: Clears the local view AND the remote database
   */
  async function clearRoomView(): Promise<void> {
    if (!confirm("Clear chat history for everyone in this room?")) return;
    
    setStatusText("Clearing...");
    try {
      await deleteRoomMessages({ roomId });
      setRoomMessages([]);
      setStatusText("History cleared.");
    } catch (err) {
      setStatusText("Failed to clear database.");
    }
  }

  function exportRoomTranscript(): void {
    const lines = roomMessages.map((m) => {
      const who = m.clientId === clientId ? "YOU" : m.displayName.toUpperCase();
      return `[${formatTime(m.createdAt)}] ${who}: ${m.text}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatroom-${roomId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSend(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === "/help") {
      setStatusText("Commands: /name YourName, /clear, /export");
      setInput("");
      return;
    }

    if (trimmed.toLowerCase().startsWith("/name ")) {
      const next = trimmed.slice(6).trim();
      if (next.length >= 1 && next.length <= 32) {
        setDisplayName(next);
        setStatusText(`Name updated: ${next}`);
      } else {
        setStatusText("Usage: /name YourName (1-32 chars)");
      }
      setInput("");
      return;
    }

    if (trimmed.toLowerCase() === "/clear") {
      void clearRoomView();
      setInput("");
      return;
    }
    if (trimmed.toLowerCase() === "/export") {
      exportRoomTranscript();
      setInput("");
      return;
    }

    setInput("");
    setIsSending(true);

    try {
      const controller = new AbortController();
      roomAbortRef.current?.abort();
      roomAbortRef.current = controller;

      const afterBeforeSend = roomMessages.length
        ? roomMessages[roomMessages.length - 1]?.createdAt
        : undefined;

      await postRoomMessage({
        roomId,
        clientId,
        displayName,
        text: trimmed,
        signal: controller.signal,
      });

      const refreshed = await fetchRoomMessages({
        roomId,
        after: afterBeforeSend,
        signal: controller.signal,
      });
      if (refreshed.messages.length) {
        setRoomMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev];
          for (const m of refreshed.messages) {
            if (!seen.has(m.id)) merged.push(m);
          }
          merged.sort((a, b) => a.createdAt - b.createdAt);
          return merged.slice(-300);
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Sorry—something went wrong.";
      setStatusText(`Send error: ${message}`);
    } finally {
      setIsSending(false);
    }
  }

  const panelMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.98 },
        transition: { duration: 0.16 },
      };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            {...panelMotion}
            className="w-[92vw] max-w-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-label="Online chatroom"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-2.5 w-2.5 rounded-full ${
                      statusText === "Online" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-semibold text-slate-900">
                    Chatroom · {roomId}
                  </p>
                </div>
                <p className="mt-1 truncate text-xs text-slate-600">
                  {statusText} · You are{" "}
                  <span className="font-mono text-[11px] text-slate-900">
                    {displayName || "…"}
                  </span>{" "}
                  <span className="text-slate-400">(use /name)</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportRoomTranscript}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => void clearRoomView()}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>
            </div>

            <div ref={listRef} className="mt-4 h-[44vh] max-h-[420px] space-y-3 overflow-auto px-4 pb-3">
              {roomMessages.length ? (
                roomMessages.map((m) => {
                  const mine = m.clientId === clientId;
                  const base = "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border";
                  const styles = mine
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white/90 text-slate-900 border-slate-200";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`${base} ${styles}`}>
                        <div className="mb-1 text-[11px] font-semibold opacity-90">
                          {mine ? "You" : m.displayName}
                        </div>
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        <div className={`mt-2 text-[11px] ${mine ? "text-white/80" : "text-slate-500"}`}>
                          {formatTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700">
                  No messages yet. Say hi!
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white/60 px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  rows={1}
                  className="max-h-24 flex-1 resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur-xl hover:bg-white"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 8h10M7 12h6M21 12a8 8 0 1 1-3.2-6.4L21 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="hidden sm:inline">Chatroom</span>
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </button>
    </div>
  );
}
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, X, Send, ChevronUp, ChevronDown, Loader2, Hash, Users, User } from "lucide-react";

interface CliqChat {
  chat_id: string;
  name: string;
  unread_message_count: number;
  last_message_info?: {
    sender_name?: string;
    text?: string;
    time?: string;
  };
  chat_type?: string;
  is_channel?: boolean;
  last_modified_time?: string;
}

interface CliqMessage {
  id: string;
  sender_name?: string;
  text?: string;
  time?: string;
  is_self?: boolean;
}

const POLL_INTERVAL = 30_000;
const HIDDEN_KEY = "cliq_hidden_chats";
const INIT_KEY = "cliq_bar_initialized";

function loadHidden(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]")); } catch { return new Set(); }
}
function saveHidden(s: Set<string>) { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...s])); }
function isFirstLoad(): boolean { return !localStorage.getItem(INIT_KEY); }
function markInitialized() { localStorage.setItem(INIT_KEY, "1"); }

function ChatIcon({ chat }: { chat: CliqChat }) {
  if (chat.is_channel) return <Hash className="w-3 h-3 shrink-0" />;
  if (chat.chat_type === "dm") return <User className="w-3 h-3 shrink-0" />;
  return <Users className="w-3 h-3 shrink-0" />;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
  } catch { return ""; }
}

export default function CliqBar({ collapsed }: { collapsed: boolean }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [chats, setChats] = useState<CliqChat[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showInbox, setShowInbox] = useState(false);
  const [activeChat, setActiveChat] = useState<CliqChat | null>(null);
  const [messages, setMessages] = useState<CliqMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setHiddenIds(loadHidden()); }, []);

  const visibleChats = chats.filter(c => !hiddenIds.has(c.chat_id));
  const totalUnread = chats.reduce((n, c) => n + (c.unread_message_count ?? 0), 0);

  const fetchChats = useCallback(async (retry = 0) => {
    try {
      const res = await fetch("/api/cliq/chats");
      if (!res.ok) {
        // 502 on cold start — retry once after 5 s
        if (res.status === 502 && retry === 0) {
          setTimeout(() => fetchChats(1), 5000);
          return;
        }
        setFetchError(`HTTP ${res.status}`); setConfigured(true); return;
      }
      const d = await res.json();
      if (d.configured === false) { setConfigured(false); return; }
      if (d.error) { setFetchError(d.error); setConfigured(true); return; }
      setFetchError("");
      setConfigured(true);
      const incoming: CliqChat[] = d.chats ?? [];
      // Filter out chats with no recent activity (inactive/removed users)
      const active = incoming.filter(c => c.last_message_info || c.is_channel);
      setChats(active);
      // First-ever load: auto-hide all chats with no unread messages
      setHiddenIds(prev => {
        if (!isFirstLoad()) return prev;
        markInitialized();
        const next = new Set(prev);
        active.forEach(c => { if (!c.unread_message_count) next.add(c.chat_id); });
        saveHidden(next);
        return next;
      });
    } catch (e: any) { setFetchError(e?.message ?? "Network error"); setConfigured(true); }
  }, []);

  useEffect(() => {
    fetchChats();
    pollRef.current = setInterval(fetchChats, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchChats]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!activeChat) return;
    setMessages([]);
    setMessagesError("");
    setMessagesLoading(true);
    const url = `/api/cliq/chats/${encodeURIComponent(activeChat.chat_id)}/messages${activeChat.is_channel ? "?isChannel=1" : ""}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        if (d.error) throw new Error(d.error);
        setMessages(d.messages ?? []);
      })
      .catch((e: any) => setMessagesError(e?.message ?? "Failed to load"))
      .finally(() => setMessagesLoading(false));
  }, [activeChat]);

  // When active chat changes, mark it as read locally
  useEffect(() => {
    if (!activeChat) return;
    setChats(prev => prev.map(c => c.chat_id === activeChat.chat_id ? { ...c, unread_message_count: 0 } : c));
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChat) setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeChat]);

  function openChat(chat: CliqChat) {
    setActiveChat(chat);
    setShowInbox(false);
    setSendError("");
    setReply("");
  }

  function closePanel() {
    setActiveChat(null);
    setReply("");
    setSendError("");
  }

  function hideChat(chatId: string) {
    const next = new Set(hiddenIds);
    next.add(chatId);
    setHiddenIds(next);
    saveHidden(next);
    if (activeChat?.chat_id === chatId) closePanel();
  }

  function unhideChat(chatId: string) {
    const next = new Set(hiddenIds);
    next.delete(chatId);
    setHiddenIds(next);
    saveHidden(next);
  }

  async function handleSend() {
    if (!activeChat || !reply.trim() || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/cliq/chats/${encodeURIComponent(activeChat.chat_id)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply.trim(), isChannel: activeChat.is_channel ?? false }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? d.detail ?? `HTTP ${res.status}`);
      }
      const sentText = reply.trim();
      setMessages(prev => [...prev, {
        id: `tmp-${Date.now()}`,
        sender_name: "You",
        text: sentText,
        time: new Date().toISOString(),
        is_self: true,
      }]);
      // Update last_message_info on the chat in the list
      setChats(prev => prev.map(c => c.chat_id === activeChat!.chat_id
        ? { ...c, last_message_info: { sender_name: "You", text: sentText, time: new Date().toISOString() } }
        : c
      ));
      setReply("");
    } catch (e: any) {
      setSendError(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (configured === false) return null;

  const sidebarOffset = collapsed ? "left-16" : "left-64";

  return (
    <>
      {/* Chat message panel */}
      {activeChat && (
        <div className="fixed z-50 flex flex-col" style={{ bottom: 40, right: 16, width: 480 }}>
          <div className="bg-white rounded-t-xl shadow-2xl border border-slate-200 flex flex-col" style={{ height: 400 }}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-t-xl text-white shrink-0">
              <ChatIcon chat={activeChat} />
              <span className="font-semibold text-sm truncate flex-1">{activeChat.name}</span>
              <button onClick={closePanel} className="text-blue-200 hover:text-white shrink-0" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50 text-sm">
              {messagesLoading && (
                <div className="flex justify-center items-center h-full text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
                </div>
              )}
              {!messagesLoading && messagesError && (
                <div className="text-center text-rose-400 py-6 text-xs">
                  <p>⚠ {messagesError}</p>
                  <button className="underline mt-1 hover:text-rose-600" onClick={() => setActiveChat({ ...activeChat! })}>Retry</button>
                </div>
              )}
              {!messagesLoading && !messagesError && messages.length === 0 && (
                <p className="text-center text-slate-400 py-6">No messages</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.is_self ? "items-end" : "items-start"}`}>
                  {msg.sender_name && !msg.is_self && (
                    <span className="text-xs text-slate-400 mb-0.5">{msg.sender_name}</span>
                  )}
                  <div className={`px-3 py-1.5 rounded-2xl max-w-[85%] text-sm leading-snug ${
                    msg.is_self ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}>
                    {msg.text ?? ""}
                  </div>
                  {msg.time && <span className="text-[10px] text-slate-400 mt-0.5">{formatTime(msg.time)}</span>}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

              <div className="shrink-0 px-3 py-2 border-t border-slate-100 bg-white">
              {sendError && <p className="text-xs text-rose-500 mb-1">{sendError}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Reply… (Enter to send, Shift+Enter for newline)"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0 mb-0.5"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inbox popup */}
      {showInbox && !activeChat && (
        <div className="fixed z-50" style={{ bottom: 40, right: 16, width: 320 }}>
          <div className="bg-white rounded-t-xl shadow-2xl border border-slate-200 flex flex-col" style={{ maxHeight: 480 }}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 rounded-t-xl text-white shrink-0">
              <MessageSquare className="w-4 h-4" />
              <span className="font-semibold text-sm flex-1">All Chats</span>
              {totalUnread > 0 && (
                <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1">{totalUnread}</span>
              )}
              <button onClick={() => setShowInbox(false)} className="text-slate-400 hover:text-white ml-1 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100">
              {chats.length === 0 && <p className="text-center text-slate-400 text-sm py-6">No chats</p>}
              {chats.map(chat => (
                <div key={chat.chat_id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 cursor-pointer group" onClick={() => openChat(chat)}>
                  <div className="text-slate-400 shrink-0"><ChatIcon chat={chat} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-800 truncate flex-1">{chat.name}</span>
                      {chat.unread_message_count > 0 && (
                        <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5">{chat.unread_message_count}</span>
                      )}
                      <span className="text-[10px] text-slate-400 shrink-0">{formatTime(chat.last_message_info?.time ?? chat.last_modified_time)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{chat.last_message_info?.text ?? ""}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); hiddenIds.has(chat.chat_id) ? unhideChat(chat.chat_id) : hideChat(chat.chat_id); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity ml-1"
                    title={hiddenIds.has(chat.chat_id) ? "Show in bar" : "Hide from bar"}
                  >
                    {hiddenIds.has(chat.chat_id) ? <ChevronDown className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
            {hiddenIds.size > 0 && (
              <div className="px-3 py-2 border-t border-slate-100 text-xs text-slate-400 text-center">
                {hiddenIds.size} hidden from bar — click X in list to toggle
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className={`fixed bottom-0 ${sidebarOffset} right-0 z-40 h-10 bg-slate-800 border-t border-slate-700 flex items-center transition-[left] duration-200`}>
        <button
          onClick={() => { setShowInbox(v => !v); if (activeChat) closePanel(); }}
          className="flex items-center gap-2 pl-4 pr-3 h-full text-slate-200 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold shrink-0 border-r border-slate-700"
          title="Open Cliq inbox"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Cliq</span>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 leading-none">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
          {showInbox ? <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" /> : <ChevronUp className="w-3 h-3 text-slate-400 ml-0.5" />}
        </button>

        {/* Visible chat chips */}
        <div className="flex items-center gap-1 overflow-x-auto px-2 h-full" style={{ scrollbarWidth: "none" }}>
          {configured === null && <span className="text-slate-500 text-xs px-2">Connecting…</span>}
          {fetchError && (
            <span className="text-rose-400 text-xs px-2 flex items-center gap-1">
              ⚠ {fetchError}
              <button onClick={() => fetchChats()} className="underline hover:text-rose-300">Retry</button>
            </span>
          )}
          {!fetchError && visibleChats.map(chat => (
            <div key={chat.chat_id} className="flex items-center shrink-0 group">
              <button
                onClick={() => openChat(chat)}
                className={`flex items-center gap-1.5 pl-2.5 pr-1.5 h-7 rounded-l-md text-xs whitespace-nowrap transition-colors ${
                  activeChat?.chat_id === chat.chat_id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white"
                }`}
              >
                <ChatIcon chat={chat} />
                <span className="max-w-[110px] truncate">{chat.name}</span>
                {chat.unread_message_count > 0 && (
                  <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 leading-none">
                    {chat.unread_message_count}
                  </span>
                )}
              </button>
              <button
                onClick={() => hideChat(chat.chat_id)}
                className={`flex items-center justify-center w-5 h-7 rounded-r-md text-xs transition-colors opacity-0 group-hover:opacity-100 ${
                  activeChat?.chat_id === chat.chat_id
                    ? "bg-blue-700 text-blue-200 hover:text-white"
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                }`}
                title="Hide from bar"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          {!fetchError && configured === true && visibleChats.length === 0 && (
            <span className="text-slate-500 text-xs px-2">Click Cliq ↑ to open inbox</span>
          )}
        </div>
      </div>
    </>
  );
}

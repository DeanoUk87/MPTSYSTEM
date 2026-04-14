"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, X, Send, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

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
}

interface CliqMessage {
  id: string;
  sender_name?: string;
  text?: string;
  time?: string;
  is_self?: boolean;
}

const POLL_INTERVAL = 30_000; // 30 s — stays under 30 req/min rate limit

export default function CliqBar({ collapsed }: { collapsed: boolean }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [chats, setChats] = useState<CliqChat[]>([]);
  const [open, setOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<CliqChat | null>(null);
  const [messages, setMessages] = useState<CliqMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalUnread = chats.reduce((n, c) => n + (c.unread_message_count ?? 0), 0);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/cliq/chats");
      if (!res.ok) { setFetchError(`HTTP ${res.status}`); setConfigured(true); return; }
      const d = await res.json();
      if (d.configured === false) { setConfigured(false); return; }
      if (d.error) { setFetchError(d.error); setConfigured(true); return; }
      setFetchError("");
      setConfigured(true);
      setChats(d.chats ?? []);
    } catch (e: any) { setFetchError(e?.message ?? "Network error"); setConfigured(true); }
  }, []);

  // Initial fetch + poll
  useEffect(() => {
    fetchChats();
    pollRef.current = setInterval(fetchChats, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchChats]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!activeChat) return;
    setMessages([]);
    setMessagesLoading(true);
    fetch(`/api/cliq/chats/${encodeURIComponent(activeChat.chat_id)}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && activeChat) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, activeChat]);

  function selectChat(chat: CliqChat) {
    setActiveChat(chat);
    setOpen(true);
    setSendError("");
  }

  function closePanel() {
    setOpen(false);
    setActiveChat(null);
    setReply("");
    setSendError("");
  }

  async function handleSend() {
    if (!activeChat || !reply.trim() || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/cliq/chats/${encodeURIComponent(activeChat.chat_id)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply.trim() }),
      });
      if (!res.ok) throw new Error("Send failed");
      setReply("");
      // Optimistically append
      setMessages(prev => [...prev, {
        id: `tmp-${Date.now()}`,
        sender_name: "You",
        text: reply.trim(),
        is_self: true,
      }]);
    } catch {
      setSendError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Don't render anything if not configured
  if (configured === false) return null;

  const sidebarOffset = collapsed ? "left-16" : "left-64";

  return (
    <>
      {/* Chat panel — slides up from bar */}
      {open && activeChat && (
        <div
          className={`fixed bottom-10 ${sidebarOffset} right-0 z-40 flex flex-col`}
          style={{ maxWidth: 420, minWidth: 320, right: 16, left: "auto" }}
        >
          <div className="bg-white rounded-t-xl shadow-2xl border border-slate-200 flex flex-col" style={{ height: 380 }}>
            {/* Panel header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-t-xl text-white shrink-0">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-sm truncate flex-1">{activeChat.name}</span>
              <button
                onClick={closePanel}
                className="text-blue-200 hover:text-white ml-1 shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50 text-sm">
              {messagesLoading && (
                <div className="flex justify-center items-center h-full text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
                </div>
              )}
              {!messagesLoading && messages.length === 0 && (
                <p className="text-center text-slate-400 py-6">No messages</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.is_self ? "items-end" : "items-start"}`}>
                  {msg.sender_name && !msg.is_self && (
                    <span className="text-xs text-slate-400 mb-0.5">{msg.sender_name}</span>
                  )}
                  <div
                    className={`px-3 py-1.5 rounded-2xl max-w-[85%] text-sm leading-snug ${
                      msg.is_self
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.text ?? ""}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            <div className="shrink-0 px-3 py-2 border-t border-slate-100 bg-white rounded-b-none">
              {sendError && <p className="text-xs text-rose-500 mb-1">{sendError}</p>}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reply…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
                  title="Send"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div
        className={`fixed bottom-0 ${sidebarOffset} right-0 z-40 h-10 bg-slate-800 border-t border-slate-700 flex items-center gap-0 transition-[left] duration-200`}
      >
        {/* Cliq label / toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 pl-4 pr-3 h-full text-slate-200 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold shrink-0 border-r border-slate-700"
          title={open ? "Hide Cliq" : "Open Cliq"}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Cliq</span>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 leading-none">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
          {open ? <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" /> : <ChevronUp className="w-3 h-3 text-slate-400 ml-0.5" />}
        </button>

        {/* Chat chips */}
        <div className="flex items-center gap-1 overflow-x-auto px-2 h-full scrollbar-none">
          {configured === null && (
            <span className="text-slate-500 text-xs px-2">Connecting…</span>
          )}
          {fetchError && (
            <span className="text-rose-400 text-xs px-2" title={fetchError}>⚠ {fetchError}</span>
          )}
          {!fetchError && configured === true && chats.map(chat => (
            <button
              key={chat.chat_id}
              onClick={() => selectChat(chat)}
              className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-xs whitespace-nowrap transition-colors shrink-0 ${
                activeChat?.chat_id === chat.chat_id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white"
              }`}
            >
              <span className="max-w-[120px] truncate">{chat.name}</span>
              {chat.unread_message_count > 0 && (
                <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 leading-none">
                  {chat.unread_message_count}
                </span>
              )}
            </button>
          ))}
          {!fetchError && configured === true && chats.length === 0 && (
            <span className="text-slate-500 text-xs px-2">No chats</span>
          )}
        </div>
      </div>
    </>
  );
}

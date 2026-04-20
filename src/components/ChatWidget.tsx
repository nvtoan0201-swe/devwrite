"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Trash2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface ChatContext {
  domain?: string;
  level?: string;
  exercise_prompt?: string;
  last_submission?: string;
}

interface ChatWidgetProps {
  context?: ChatContext;
}

const STORAGE_KEY = "devwrite-chat-v1";

export default function ChatWidget({ context }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");
      setMessages((cur) => [...cur, { role: "assistant", content: data.reply || "(empty reply)" }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chat failed";
      setMessages((cur) => [...cur, { role: "assistant", content: msg, error: true }]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages, context]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[#1b61c9] px-5 py-3 text-[14px] font-medium text-white shadow-[rgba(45,127,249,0.35)_0px_4px_16px] hover:bg-[#174fa5] transition-colors"
        aria-label="Open chat"
      >
        <MessageCircle size={16} />
        Ask Claude
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-32px))] h-[min(560px,calc(100vh-48px))] flex flex-col bg-white border border-[#e0e2e6] rounded-[16px] shadow-[rgba(0,0,0,0.32)_0px_0px_1px,rgba(0,0,0,0.08)_0px_0px_2px,rgba(45,127,249,0.28)_0px_4px_16px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e2e6]">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: "#1b61c9", color: "white" }}
            aria-hidden
          >
            <Sparkles size={12} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-medium text-[#181d26] tracking-[0.08px]">
              Ask Claude
            </span>
            <span className="text-[11px] text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
              Tiếng Việt hoặc English
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="p-1.5 rounded-md text-[rgba(4,14,32,0.55)] hover:bg-[#f8fafc] hover:text-[#181d26] transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md text-[rgba(4,14,32,0.55)] hover:bg-[#f8fafc] hover:text-[#181d26] transition-colors"
            aria-label="Close chat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#f8fafc]"
      >
        {messages.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="text-[14px] font-medium text-[#181d26]">
              Hỏi nhanh bất kỳ điều gì.
            </p>
            <p className="text-[12px] text-[rgba(4,14,32,0.69)] tracking-[0.08px] max-w-[260px]">
              Ngữ pháp, từ vựng kỹ thuật, cách viết câu đó tự nhiên hơn — bằng
              tiếng Việt hoặc English đều được.
            </p>
            <div className="mt-3 flex flex-col gap-1.5 w-full">
              {[
                "Giải thích 'idempotent' bằng tiếng Việt",
                "Khi nào dùng 'affect' vs 'effect'?",
                "Viết commit message này chuyên nghiệp hơn nhé",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  className="text-left text-[12px] rounded-[10px] border border-[#e0e2e6] bg-white px-3 py-2 text-[rgba(4,14,32,0.82)] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} message={m} />)
        )}
        {isSending && (
          <div className="flex items-center gap-2 text-[12px] text-[rgba(4,14,32,0.55)]">
            <Loader2 size={12} className="animate-spin" />
            Đang hỏi Claude Code…
          </div>
        )}
      </div>

      <div className="border-t border-[#e0e2e6] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Viết tin nhắn… Enter để gửi, Shift+Enter xuống dòng"
            className="flex-1 resize-none rounded-[12px] border border-[#e0e2e6] bg-white px-3 py-2 text-[13px] leading-[1.45] text-[#181d26] focus:outline-none focus:border-[#1b61c9] focus:shadow-[0_0_0_3px_rgba(27,97,201,0.12)]"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || isSending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1b61c9] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#174fa5] transition-colors"
            aria-label="Send message"
          >
            {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[14px] px-3 py-2 text-[13px] leading-[1.5] whitespace-pre-wrap tracking-[0.08px] ${
          isUser
            ? "bg-[#1b61c9] text-white rounded-br-[4px]"
            : message.error
            ? "bg-[rgba(179,38,30,0.08)] border border-[rgba(179,38,30,0.25)] text-[#b3261e] rounded-bl-[4px]"
            : "bg-white border border-[#e0e2e6] text-[#181d26] rounded-bl-[4px]"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

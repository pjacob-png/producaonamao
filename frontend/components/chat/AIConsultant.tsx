"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, X } from "lucide-react";
import { clsx } from "clsx";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIConsultant({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou o **Chef Consultor IA** do Produção na Mão. Posso te ajudar com receitas, CMV, modos de preparo, precificação e muito mais. Como posso ajudar hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const allMessages = [...messages, userMsg];
    let assistantText = "";
    setMessages((m) => [...m, { role: "assistant", content: "..." }]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai-chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: assistantText }]);
      }
    } catch {
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: "Erro ao conectar com o consultor IA. Verifique a configuração." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-900 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-brand-400" />
          <span className="text-white font-medium text-sm">Chef Consultor IA</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={clsx("flex gap-2 text-sm", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center shrink-0",
              msg.role === "user" ? "bg-brand-500" : "bg-gray-800")}>
              {msg.role === "user" ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
            </div>
            <div className={clsx("max-w-[80%] px-3 py-2 rounded-xl leading-relaxed whitespace-pre-wrap",
              msg.role === "user" ? "bg-brand-500 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none")}>
              {msg.content === "..." ? <span className="animate-pulse">...</span> : msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Pergunte sobre receitas, CMV, preparo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary px-3 py-2">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

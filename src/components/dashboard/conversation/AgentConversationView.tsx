import { useState, useRef, useEffect, useCallback } from "react";
import type { AgentInfo } from "@/types/dashboard";
import InteractiveElement, { type ConversationElement } from "./InteractiveElements";
import { supabase } from "@/integrations/supabase/client";

interface ConversationMessage {
  role: "agent" | "user";
  content: string;
  elements?: ConversationElement[];
}

interface Props {
  agent: AgentInfo;
  conversationScope: string | null;
  messages: ConversationMessage[];
  onSendMessage: (content: string, elementResponses?: { element_id: string; value: any }[]) => void;
  isTyping?: boolean;
  taskId?: string;
  onMessagesRefresh?: (messages: ConversationMessage[]) => void;
}

const formatScope = (scope: string | null): string => {
  if (!scope) return "";
  const map: Record<string, string> = {
    account_setup: "Account Setup",
    post_approval: "Post Approval",
    queue_review: "Queue Review",
    gsc_setup: "Search Console Setup",
    cms_setup: "Website Access Setup",
  };
  return map[scope] || scope.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const AgentConversationView = ({ agent, conversationScope, messages, onSendMessage, isTyping, taskId, onMessagesRefresh }: Props) => {
  const [input, setInput] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    onSendMessage(text);
  };

  const handleElementSubmit = (elementId: string, value: any) => {
    const summary = Array.isArray(value)
      ? `Selected: ${value.join(", ")}`
      : typeof value === "boolean"
      ? "Confirmed"
      : `Selected: ${value}`;
    onSendMessage(summary, [{ element_id: elementId, value }]);
  };

  const handleOAuthClick = useCallback((platform: string) => {
    if (!taskId || pollRef.current) return;

    // Poll every 3 seconds for up to 5 minutes
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 3000;
      if (elapsed > 300000) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        return;
      }

      try {
        const { data: task } = await supabase
          .from("sprint_tasks")
          .select("conversation_state, conversation_messages")
          .eq("id", taskId)
          .single();

        if (!task) return;

        const connections = (task.conversation_state as any)?.connections || {};
        if (connections[platform]?.status === "connected") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          // Refresh messages in parent
          if (onMessagesRefresh && Array.isArray(task.conversation_messages)) {
            onMessagesRefresh(task.conversation_messages as unknown as ConversationMessage[]);
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 3000);
  }, [taskId, onMessagesRefresh]);

  return (
    <>
      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed"
            style={msg.role === "user" ? {
              alignSelf: "flex-end",
              background: "hsl(var(--dash-accent))",
              color: "white",
              borderBottomRightRadius: "4px",
            } : {
              alignSelf: "flex-start",
              background: "hsl(var(--dash-border-light))",
              borderBottomLeftRadius: "4px",
            }}
          >
            {msg.role === "agent" && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: agent.color }}
                >
                  {agent.initials}
                </div>
                <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
                  {agent.name}
                </span>
              </div>
            )}
            <div>{msg.content}</div>
            {msg.elements?.map((el, j) => (
              <InteractiveElement
                key={j}
                element={el}
                onSubmit={handleElementSubmit}
                onOAuthClick={handleOAuthClick}
              />
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div
            className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed"
            style={{ alignSelf: "flex-start", background: "hsl(var(--dash-border-light))", borderBottomLeftRadius: "4px" }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: agent.color }}
              >
                {agent.initials}
              </div>
              <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
                {agent.name}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--dash-text-tertiary))", animationDelay: "0s" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--dash-text-tertiary))", animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--dash-text-tertiary))", animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-lg px-3.5 py-2.5 text-[13px] font-dm-sans outline-none transition-colors"
          style={{ border: "1px solid hsl(var(--dash-border))" }}
          placeholder={`Reply to ${agent.name}...`}
        />
        <button
          onClick={handleSend}
          className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-white text-base cursor-pointer"
          style={{ background: agent.color }}
        >
          ↑
        </button>
      </div>
    </>
  );
};

export { formatScope };
export type { ConversationMessage };
export default AgentConversationView;

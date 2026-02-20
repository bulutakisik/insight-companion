import { useRef, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  activeTab: "live" | "history";
  onTabChange: (tab: "live" | "history") => void;
  chatItems: any[];
}

const ChatDrawer = ({ open, onClose, activeTab, onTabChange, chatItems }: Props) => {
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [activeTab, chatItems]);

  // Extract messages from chat_items for the Initial Conversation tab
  const historyMessages = chatItems
    .filter((item: any) => item.type === "message")
    .map((item: any) => item.data);

  return (
    <div
      className="absolute top-0 right-0 w-[420px] h-full flex flex-col z-[100] transition-transform duration-300"
      style={{
        background: "hsl(var(--dash-card))",
        borderLeft: "1px solid hsl(var(--dash-border))",
        boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.08)" : "none",
        transform: open ? "translateX(0)" : "translateX(100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold text-white" style={{ background: "hsl(var(--dash-accent))" }}>
            GD
          </div>
          <div>
            <div className="text-sm font-semibold">Growth Director</div>
            <div className="text-[11px]" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Ask about sprint status, strategy, or next steps</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm cursor-pointer transition-colors"
          style={{ border: "1px solid hsl(var(--dash-border))", background: "hsl(var(--dash-bg))", color: "hsl(var(--dash-text-secondary))" }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))" }}>
        <TabBtn active={activeTab === "live"} onClick={() => onTabChange("live")}>Sprint Chat</TabBtn>
        <TabBtn active={activeTab === "history"} onClick={() => onTabChange("history")}>Initial Conversation</TabBtn>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 scrollbar-thin">
        {activeTab === "live" ? (
          <div className="text-center py-12">
            <div className="text-sm font-medium mb-1">Sprint Chat</div>
            <div className="text-xs" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
              Live Q&A with the Growth Director coming soon.
            </div>
          </div>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-center py-2 mb-1 border-b" style={{ color: "hsl(var(--dash-text-tertiary))", borderColor: "hsl(var(--dash-border-light))" }}>
              Initial Conversation
            </div>
            {historyMessages.map((msg: any, i: number) => (
              <div
                key={i}
                className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed opacity-75"
                style={msg.sender === "user" ? {
                  alignSelf: "flex-end",
                  background: "hsl(var(--dash-accent))",
                  color: "white",
                  borderBottomRightRadius: "4px",
                } : {
                  alignSelf: "flex-start",
                  background: "hsl(var(--dash-border-light))",
                  borderBottomLeftRadius: "4px",
                }}
                dangerouslySetInnerHTML={{ __html: msg.html }}
              />
            ))}
          </>
        )}
      </div>

      {/* Input / Read-only notice */}
      {activeTab === "live" ? (
        <div className="px-5 py-3 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))" }}>
          <input
            className="flex-1 rounded-lg px-3.5 py-2.5 text-[13px] font-dm-sans outline-none transition-colors"
            style={{ border: "1px solid hsl(var(--dash-border))" }}
            placeholder="Ask about sprint status..."
          />
          <button
            className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-white text-base cursor-pointer"
            style={{ background: "hsl(var(--dash-accent))" }}
          >
            ↑
          </button>
        </div>
      ) : (
        <div className="px-5 py-3 border-t text-center text-[11px] flex-shrink-0" style={{ borderColor: "hsl(var(--dash-border))", color: "hsl(var(--dash-text-tertiary))", background: "hsl(var(--dash-border-light))" }}>
          This is a read-only view of your initial diagnosis conversation.
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="flex-1 px-4 py-2.5 text-xs font-medium text-center cursor-pointer transition-all"
    style={{
      color: active ? "hsl(var(--dash-accent))" : "hsl(var(--dash-text-tertiary))",
      borderBottom: active ? "2px solid hsl(var(--dash-accent))" : "2px solid transparent",
    }}
  >
    {children}
  </button>
);

export default ChatDrawer;

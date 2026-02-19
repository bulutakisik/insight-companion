import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { ChatMessage, StreamBlockData, ConversationPhase } from "@/types/conversation";
import { getPlaceholderForPhase } from "@/lib/stateMachine";
import { ChevronDown } from "lucide-react";
import ChatMessageBubble from "./ChatMessageBubble";
import StreamBlock from "./StreamBlock";

type ChatItem =
  | { type: "message"; data: ChatMessage }
  | { type: "stream"; data: StreamBlockData };

interface ChatPanelProps {
  items: ChatItem[];
  phase: ConversationPhase;
  inputDisabled: boolean;
  onSend: (text: string) => void;
}

const ChatPanel = ({ items, phase, inputDisabled, onSend }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userHasScrolledUpRef = useRef(false);
  const prevScrollTopRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced scroll handler
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
        const scrolledUp = el.scrollTop < prevScrollTopRef.current;

        if (scrolledUp && !atBottom) {
          userHasScrolledUpRef.current = true;
          setShowScrollBtn(true);
        } else if (atBottom) {
          userHasScrolledUpRef.current = false;
          setShowScrollBtn(false);
        }

        prevScrollTopRef.current = el.scrollTop;
      }, 100);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Auto-scroll only if user hasn't scrolled up
  useEffect(() => {
    if (!userHasScrolledUpRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  const scrollToBottom = () => {
    userHasScrolledUpRef.current = false;
    setShowScrollBtn(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleSend = () => {
    const val = inputValue.trim();
    if (!val || inputDisabled) return;
    setInputValue("");
    onSend(val);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="border-r border-border flex flex-col bg-background-2 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pb-4 scrollbar-thin">
        {items.map((item, i) =>
          item.type === "message" ? (
            <ChatMessageBubble key={item.data.id} message={item.data} />
          ) : (
            <StreamBlock key={item.data.id} data={item.data} />
          )
        )}
      </div>
      {showScrollBtn && (
        <div className="relative shrink-0 flex justify-center" style={{ height: 0 }}>
          <button
            onClick={scrollToBottom}
            className="absolute -top-10 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border shadow-md flex items-center justify-center hover:bg-background transition-all"
          >
            <ChevronDown size={16} className="text-foreground/70" />
          </button>
        </div>
      )}
      <div className="p-3 px-6 pb-5 shrink-0">
        <div
          className={`flex items-center gap-2 bg-background border-[1.5px] border-border rounded-[14px] px-4 pr-1 transition-all ${
            !inputDisabled ? "focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(45,45,42,0.06)]" : ""
          }`}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            placeholder={getPlaceholderForPhase(phase)}
            className="flex-1 bg-transparent border-none outline-none font-sans text-sm text-foreground py-2.5 placeholder:text-foreground-4 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={inputDisabled || !inputValue.trim()}
            className="w-9 h-9 rounded-[10px] bg-primary text-primary-foreground flex items-center justify-center shrink-0 transition-all hover:bg-accent hover:scale-[1.04] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

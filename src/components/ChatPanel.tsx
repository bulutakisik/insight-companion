import { useRef, useEffect, useState, useCallback, KeyboardEvent } from "react";
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
  isThinking?: boolean;
  onSend: (text: string) => void;
}

const ThinkingIndicator = () => (
  <div className="mb-5 animate-fade-up">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-primary text-primary-foreground animate-thinking-pulse">
        GD
      </div>
      <div className="text-[13px] font-semibold">Growth Director</div>
    </div>
    <div className="pl-9 flex items-center gap-1.5 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-foreground-3 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-foreground-3 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-foreground-3 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const ChatPanel = ({ items, phase, inputDisabled, isThinking, onSend }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userHasScrolledUpRef = useRef(false);
  const prevScrollTopRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasSubmittedUrl = items.some((item) => item.type === "message" && item.data.sender === "user");

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [inputValue, resizeTextarea]);

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
  }, [items, isThinking]);

  const scrollToBottom = () => {
    userHasScrolledUpRef.current = false;
    setShowScrollBtn(false);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleSend = () => {
    const val = inputValue.trim();
    if (!val || inputDisabled) return;
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSend(val);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = hasSubmittedUrl
    ? "Tell me everything about your product..."
    : getPlaceholderForPhase(phase);

  return (
    <div className="border-r border-border flex flex-col bg-background-2 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pb-4 scrollbar-thin">
        {items.map((item) =>
          item.type === "message" ? (
            <ChatMessageBubble key={item.data.id} message={item.data} />
          ) : (
            <StreamBlock key={item.data.id} data={item.data} />
          )
        )}
        {isThinking && <ThinkingIndicator />}
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
          className={`flex items-end gap-2 bg-background border-[1.5px] border-border rounded-[14px] px-4 pr-1 transition-all ${
            !inputDisabled ? "focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(45,45,42,0.06)]" : ""
          }`}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none font-sans text-sm text-foreground py-2.5 placeholder:text-foreground-4 disabled:opacity-50 resize-none leading-relaxed"
            style={{ maxHeight: "150px" }}
          />
          <button
            onClick={handleSend}
            disabled={inputDisabled || !inputValue.trim()}
            className="w-9 h-9 rounded-[10px] bg-primary text-primary-foreground flex items-center justify-center shrink-0 transition-all hover:bg-accent hover:scale-[1.04] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-0.5"
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

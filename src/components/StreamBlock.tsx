import { useState, useEffect, useRef, useCallback } from "react";
import { StreamBlockData, StreamItem } from "@/types/conversation";

interface StreamBlockProps {
  data: StreamBlockData;
  onComplete?: () => void;
}

const StreamBlock = ({ data, onComplete }: StreamBlockProps) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (visibleCount >= data.items.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        if (data.summary) {
          const t = setTimeout(() => {
            setShowSummary(true);
            onComplete?.();
          }, 200);
          return () => clearTimeout(t);
        } else {
          onComplete?.();
        }
      }
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, 400);

    return () => clearTimeout(timer);
  }, [visibleCount, data.items.length, data.summary, onComplete]);

  return (
    <div className="my-4 ml-9 p-3.5 px-4 bg-background-3 border border-border rounded-xl animate-fade-up">
      {data.items.slice(0, visibleCount).map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 py-1.5 text-[13px] text-foreground-2 animate-stream-item-in"
        >
          <span className="w-5 text-center text-xs shrink-0">{item.icon}</span>
          <span dangerouslySetInnerHTML={{ __html: item.text }} />
        </div>
      ))}
      {showSummary && data.summary && (
        <div className="mt-2.5 pt-2.5 border-t border-border text-xs text-success font-semibold flex items-center gap-1.5">
          ✓ {data.summary}
        </div>
      )}
    </div>
  );
};

export default StreamBlock;

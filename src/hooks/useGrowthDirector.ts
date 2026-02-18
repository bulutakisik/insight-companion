import { useState, useRef, useCallback } from "react";
import { parseStreamChunk, StreamEvent } from "@/lib/streamParser";
import { ChatMessage, StreamBlockData, StreamItem, OutputCard, ProgressStep, ConversationPhase } from "@/types/conversation";
import { INITIAL_PROGRESS_STEPS } from "@/lib/stateMachine";

type ChatItem =
  | { type: "message"; data: ChatMessage }
  | { type: "stream"; data: StreamBlockData };

interface WhatsNextData {
  icon: string;
  title: string;
  desc: string;
}

let msgIdCounter = 0;
const nextId = () => `msg-${++msgIdCounter}`;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useGrowthDirector() {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [outputCards, setOutputCards] = useState<OutputCard[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(INITIAL_PROGRESS_STEPS);
  const [progressVisible, setProgressVisible] = useState(false);
  const [whatsNext, setWhatsNext] = useState<WhatsNextData | null>(null);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [phase, setPhase] = useState<ConversationPhase>(0);

  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const bufferRef = useRef("");
  const currentStreamItemsRef = useRef<StreamItem[]>([]);
  const streamBlockIdRef = useRef(0);
  const isStreamingRef = useRef(false);
  const fullTextRef = useRef("");

  // Add initial greeting
  const initGreeting = useCallback(() => {
    const introMsg: ChatMessage = {
      id: "intro",
      sender: "director",
      html: `Hey — I'm your Growth Director.<br/><br/>I'm going to analyze your business, find where your growth is stuck, and build you a month-long plan with a team of AI agents to fix it.<br/><br/><strong>What's your website URL?</strong>`,
      timestamp: Date.now(),
    };
    setChatItems([{ type: "message", data: introMsg }]);
    setInputDisabled(false);
  }, []);

  const handleEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case "chat_text":
        // Update or create the last director message
        setChatItems((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === "message" && last.data.sender === "director" && last.data.id.startsWith("stream-")) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              type: "message",
              data: { ...last.data, html: last.data.html + event.text },
            };
            return updated;
          }
          // Create new director message
          return [
            ...prev,
            {
              type: "message",
              data: {
                id: `stream-${nextId()}`,
                sender: "director" as const,
                html: event.text,
                timestamp: Date.now(),
              },
            },
          ];
        });
        break;

      case "stream_item":
        currentStreamItemsRef.current = [
          ...currentStreamItemsRef.current,
          { icon: event.icon, text: event.text },
        ];
        const streamId = `sblock-${streamBlockIdRef.current}`;
        const items = [...currentStreamItemsRef.current];
        setChatItems((prev) => {
          const lastIdx = prev.findIndex(
            (item) => item.type === "stream" && item.data.id === streamId
          );
          if (lastIdx >= 0) {
            const updated = [...prev];
            updated[lastIdx] = {
              type: "stream",
              data: { id: streamId, items },
            };
            return updated;
          }
          return [
            ...prev,
            { type: "stream", data: { id: streamId, items } },
          ];
        });
        break;

      case "stream_complete":
        const completeStreamId = `sblock-${streamBlockIdRef.current}`;
        const finalItems = [...currentStreamItemsRef.current];
        setChatItems((prev) => {
          const idx = prev.findIndex(
            (item) => item.type === "stream" && item.data.id === completeStreamId
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              type: "stream",
              data: { id: completeStreamId, items: finalItems, summary: event.summary },
            };
            return updated;
          }
          return prev;
        });
        // Reset for next stream block
        currentStreamItemsRef.current = [];
        streamBlockIdRef.current++;
        break;

      case "output":
        setOutputCards((prev) => [...prev, { type: event.outputType, data: event.data } as OutputCard]);
        break;

      case "progress":
        setProgressVisible(true);
        setProgressSteps((prev) =>
          prev.map((s) => (s.id === event.step ? { ...s, state: event.state } : s))
        );
        break;

      case "whats_next":
        setWhatsNext({ icon: event.icon, title: event.title, desc: event.desc });
        break;

      case "whats_next_clear":
        setWhatsNext(null);
        break;
    }
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (isStreamingRef.current) return;
    isStreamingRef.current = true;
    setInputDisabled(true);

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: nextId(),
      sender: "user",
      html: userMessage,
      timestamp: Date.now(),
    };
    setChatItems((prev) => [...prev, { type: "message", data: userMsg }]);

    // Update conversation history
    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role: "user", content: userMessage },
    ];

    bufferRef.current = "";
    fullTextRef.current = "";
    currentStreamItemsRef.current = [];

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/growth-director`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationHistoryRef.current }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = sseBuffer.indexOf("\n")) !== -1) {
          let line = sseBuffer.slice(0, newlineIndex);
          sseBuffer = sseBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "text") {
              fullTextRef.current += data.text;
              const { events, remainingBuffer } = parseStreamChunk(bufferRef.current, data.text);
              bufferRef.current = remainingBuffer;
              for (const event of events) {
                handleEvent(event);
              }
            } else if (data.type === "done") {
              // Flush remaining buffer
              if (bufferRef.current.trim()) {
                const { events } = parseStreamChunk("", bufferRef.current);
                for (const event of events) {
                  handleEvent(event);
                }
                bufferRef.current = "";
              }
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Save assistant response to history
      conversationHistoryRef.current = [
        ...conversationHistoryRef.current,
        { role: "assistant", content: fullTextRef.current },
      ];
    } catch (error) {
      console.error("Stream error:", error);
      setChatItems((prev) => [
        ...prev,
        {
          type: "message",
          data: {
            id: nextId(),
            sender: "director" as const,
            html: "Something went wrong. Please try again.",
            timestamp: Date.now(),
          },
        },
      ]);
    } finally {
      isStreamingRef.current = false;
      setInputDisabled(false);
    }
  }, [handleEvent]);

  return {
    chatItems,
    outputCards,
    progressSteps,
    progressVisible,
    whatsNext,
    inputDisabled,
    phase,
    sendMessage,
    initGreeting,
  };
}

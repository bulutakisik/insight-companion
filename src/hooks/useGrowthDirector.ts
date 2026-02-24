import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { parseStreamChunk, StreamEvent } from "@/lib/streamParser";
import { ChatMessage, StreamBlockData, StreamItem, OutputCard, ProgressStep, ConversationPhase, CARD_TYPE_ORDER } from "@/types/conversation";
import { INITIAL_PROGRESS_STEPS } from "@/lib/stateMachine";
import { supabase } from "@/integrations/supabase/client";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [outputCards, setOutputCards] = useState<OutputCard[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(INITIAL_PROGRESS_STEPS);
  const [progressVisible, setProgressVisible] = useState(false);
  const [whatsNext, setWhatsNext] = useState<WhatsNextData | null>(null);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [phase, setPhase] = useState<ConversationPhase>(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const bufferRef = useRef("");
  const currentStreamItemsRef = useRef<StreamItem[]>([]);
  const streamBlockIdRef = useRef(0);
  const isStreamingRef = useRef(false);
  const fullTextRef = useRef("");
  const sessionIdRef = useRef<string | null>(null);

  // Save session state to Supabase
  const saveSession = useCallback(async (
    items: ChatItem[],
    cards: OutputCard[],
    steps: ProgressStep[],
    whatsNextData: WhatsNextData | null,
    currentPhase: ConversationPhase,
    companyUrl?: string
  ) => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    const payload: Record<string, unknown> = {
      chat_items: items,
      output_cards: cards,
      conversation_history: conversationHistoryRef.current,
      current_phase: currentPhase,
      progress_steps: steps,
      whats_next: whatsNextData,
    };
    if (companyUrl) payload.company_url = companyUrl;

    await supabase.from("growth_sessions").update(payload).eq("id", sid);
  }, []);

  // Create a new session and set URL param
  const createSession = useCallback(async (companyUrl?: string) => {
    const { data, error } = await supabase
      .from("growth_sessions")
      .insert({ company_url: companyUrl })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create session:", error);
      return null;
    }

    sessionIdRef.current = data.id;
    setSearchParams({ session: data.id }, { replace: true });
    return data.id;
  }, [setSearchParams]);

  // Load existing session from URL
  const loadSession = useCallback(async () => {
    const sessionParam = searchParams.get("session");
    if (!sessionParam) {
      setSessionLoaded(true);
      return false;
    }

    const { data, error } = await supabase
      .from("growth_sessions")
      .select("*")
      .eq("id", sessionParam)
      .single();

    if (error || !data) {
      console.error("Session not found:", error);
      setSessionLoaded(true);
      return false;
    }

    sessionIdRef.current = data.id;

    // Restore state
    const restoredItems = (data.chat_items as unknown as ChatItem[]) || [];
    const restoredCards = (data.output_cards as unknown as OutputCard[]) || [];
    const restoredSteps = (data.progress_steps as unknown as ProgressStep[]) || [];
    const restoredHistory = (data.conversation_history as unknown as { role: string; content: string }[]) || [];
    const restoredWhatsNext = data.whats_next as unknown as WhatsNextData | null;
    const restoredPhase = (data.current_phase ?? 0) as ConversationPhase;

    setChatItems(restoredItems);
    setOutputCards(restoredCards);
    if (restoredSteps.length > 0) {
      setProgressSteps(restoredSteps);
      setProgressVisible(true);
    }
    setWhatsNext(restoredWhatsNext);
    setPhase(restoredPhase);
    conversationHistoryRef.current = restoredHistory;

    // Restore counters to avoid ID collisions
    msgIdCounter = restoredItems.length + 100;
    streamBlockIdRef.current = restoredItems.filter(i => i.type === "stream").length + 10;

    // Enable input if session was restored (user can continue chatting)
    setInputDisabled(false);

    setSessionLoaded(true);
    return true;
  }, [searchParams]);

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
        setIsThinking(false);
        setChatItems((prev) => {
          const last = prev[prev.length - 1];
          const currentRoundId = `stream-round-${streamBlockIdRef.current}`;
          if (last?.type === "message" && last.data.sender === "director" && last.data.id === currentRoundId) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              type: "message",
              data: { ...last.data, html: last.data.html + event.text },
            };
            return updated;
          }
          return [
            ...prev,
            {
              type: "message",
              data: {
                id: currentRoundId,
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
        currentStreamItemsRef.current = [];
        streamBlockIdRef.current++;
        break;

      case "output":
        console.log("[Hook] Received output event:", event.outputType, event.data);
        setOutputCards((prev) => {
          // Replace existing card of same type (update behavior), or add new
          const existingIdx = prev.findIndex((c) => c.type === event.outputType);
          const newCard = { type: event.outputType, data: event.data } as OutputCard;
          let updated: OutputCard[];
          if (existingIdx >= 0) {
            console.log("[Hook] Replacing existing card:", event.outputType);
            updated = [...prev];
            updated[existingIdx] = newCard;
          } else {
            updated = [...prev, newCard];
          }
          // Sort by fixed card order
          updated.sort((a, b) => {
            const ai = CARD_TYPE_ORDER.indexOf(a.type);
            const bi = CARD_TYPE_ORDER.indexOf(b.type);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
          return updated;
        });
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

    // Create session on first message if none exists
    const isFirstMessage = conversationHistoryRef.current.length === 0;
    if (!sessionIdRef.current) {
      const companyUrl = isFirstMessage ? userMessage.trim() : undefined;
      await createSession(companyUrl);
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: nextId(),
      sender: "user",
      html: userMessage,
      timestamp: Date.now(),
    };
    setChatItems((prev) => [...prev, { type: "message", data: userMsg }]);
    setIsThinking(true);

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

      // Save session after response completes — read latest state
      setChatItems((latestItems) => {
        setOutputCards((latestCards) => {
          setProgressSteps((latestSteps) => {
            setWhatsNext((latestWhatsNext) => {
              saveSession(
                latestItems,
                latestCards,
                latestSteps,
                latestWhatsNext,
                phase,
                isFirstMessage ? userMessage.trim() : undefined
              );
              return latestWhatsNext;
            });
            return latestSteps;
          });
          return latestCards;
        });
        return latestItems;
      });
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
      setIsThinking(false);
      setInputDisabled(false);
    }
  }, [handleEvent, createSession, saveSession, phase]);

  return {
    chatItems,
    outputCards,
    whatsNext,
    inputDisabled,
    isThinking,
    phase,
    sessionLoaded,
    sendMessage,
    initGreeting,
    loadSession,
  };
}

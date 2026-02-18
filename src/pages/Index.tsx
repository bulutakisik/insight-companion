import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "@/components/TopBar";
import ChatPanel from "@/components/ChatPanel";
import StagePanel from "@/components/StagePanel";
import { ChatMessage, StreamBlockData, OutputCard, ProgressStep, ConversationPhase } from "@/types/conversation";
import { INITIAL_PROGRESS_STEPS } from "@/lib/stateMachine";
import { getPhase0Sequence, getPhase1Sequence, getPhase2Sequence, SimulationStep } from "@/lib/mockData";

type ChatItem =
  | { type: "message"; data: ChatMessage }
  | { type: "stream"; data: StreamBlockData };

interface WhatsNextData {
  icon: string;
  title: string;
  desc: string;
}

const Index = () => {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [outputCards, setOutputCards] = useState<OutputCard[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(INITIAL_PROGRESS_STEPS);
  const [phase, setPhase] = useState<ConversationPhase>(0);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [progressVisible, setProgressVisible] = useState(false);
  const [whatsNext, setWhatsNext] = useState<WhatsNextData | null>(null);
  const runningRef = useRef(false);

  // Initial greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      const introMsg: ChatMessage = {
        id: "intro",
        sender: "director",
        html: `Hey — I'm your Growth Director.<br/><br/>I'm going to analyze your business, find where your growth is stuck, and build you a month-long plan with a team of AI agents to fix it.<br/><br/><strong>What's your website URL?</strong>`,
        timestamp: Date.now(),
      };
      setChatItems([{ type: "message", data: introMsg }]);
      setInputDisabled(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runSequence = useCallback(async (steps: SimulationStep[]) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setInputDisabled(true);

    for (const step of steps) {
      switch (step.type) {
        case "message":
          setChatItems((prev) => [...prev, { type: "message", data: step.data }]);
          break;
        case "stream":
          setChatItems((prev) => [...prev, { type: "stream", data: step.data }]);
          // Wait for stream animation
          await wait((step.data as StreamBlockData).items.length * 400 + 400);
          break;
        case "outputCard":
          setOutputCards((prev) => [...prev, step.data]);
          break;
        case "progress":
          setProgressVisible(true);
          setProgressSteps((prev) =>
            prev.map((s) => (s.id === step.data.step ? { ...s, state: step.data.state } : s))
          );
          break;
        case "wait":
          await wait(step.data);
          break;
        case "whatsNext":
          setWhatsNext(step.data);
          break;
        case "enableInput":
          setPhase(step.data as ConversationPhase);
          setInputDisabled(false);
          break;
      }
    }
    runningRef.current = false;
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (phase === 0) {
        setWhatsNext(null);
        runSequence(getPhase0Sequence(text));
      } else if (phase === 1) {
        setWhatsNext(null);
        runSequence(getPhase1Sequence(text));
      } else if (phase === 2) {
        setWhatsNext(null);
        runSequence(getPhase2Sequence(text));
      }
    },
    [phase, runSequence]
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <ChatPanel items={chatItems} phase={phase} inputDisabled={inputDisabled} onSend={handleSend} />
        <StagePanel
          outputCards={outputCards}
          progressSteps={progressSteps}
          progressVisible={progressVisible}
          whatsNext={whatsNext}
        />
      </div>
    </div>
  );
};

export default Index;

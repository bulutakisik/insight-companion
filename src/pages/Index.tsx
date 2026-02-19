import { useEffect } from "react";
import TopBar from "@/components/TopBar";
import ChatPanel from "@/components/ChatPanel";
import StagePanel from "@/components/StagePanel";
import { useGrowthDirector } from "@/hooks/useGrowthDirector";

const Index = () => {
  const {
    chatItems,
    outputCards,
    progressSteps,
    progressVisible,
    whatsNext,
    inputDisabled,
    phase,
    sessionLoaded,
    sendMessage,
    initGreeting,
    loadSession,
  } = useGrowthDirector();

  useEffect(() => {
    loadSession().then((restored) => {
      if (!restored) {
        const timer = setTimeout(() => initGreeting(), 600);
        return () => clearTimeout(timer);
      }
    });
  }, [loadSession, initGreeting]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <ChatPanel items={chatItems} phase={phase} inputDisabled={inputDisabled || !sessionLoaded} onSend={sendMessage} />
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

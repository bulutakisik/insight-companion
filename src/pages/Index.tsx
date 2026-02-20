import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import ChatPanel from "@/components/ChatPanel";
import StagePanel from "@/components/StagePanel";
import { useGrowthDirector } from "@/hooks/useGrowthDirector";

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // Redirect to dashboard if ?dashboard=true
  useEffect(() => {
    const sessionId = searchParams.get("session");
    const isDashboard = searchParams.get("dashboard") === "true";
    if (sessionId && isDashboard) {
      navigate(`/dashboard?session=${sessionId}&dashboard=true`, { replace: true });
      return;
    }
  }, [searchParams, navigate]);

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

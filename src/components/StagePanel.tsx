import { OutputCard, ProgressStep } from "@/types/conversation";
import ProgressBar from "./ProgressBar";
import ProductAnalysisCard from "./cards/ProductAnalysisCard";
import CompetitiveCard from "./cards/CompetitiveCard";
import FunnelCard from "./cards/FunnelCard";
import WorkStatementCard from "./cards/WorkStatementCard";
import PaywallCard from "./cards/PaywallCard";

interface WhatsNextData {
  icon: string;
  title: string;
  desc: string;
}

interface StagePanelProps {
  outputCards: OutputCard[];
  progressSteps: ProgressStep[];
  progressVisible: boolean;
  whatsNext: WhatsNextData | null;
}

const StagePanel = ({ outputCards, progressSteps, progressVisible, whatsNext }: StagePanelProps) => {
  const isEmpty = outputCards.length === 0;

  return (
    <div className="bg-background flex flex-col min-h-0 overflow-hidden">
      <ProgressBar steps={progressSteps} visible={progressVisible} />
      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <h2 className="font-serif text-[26px] font-normal mb-2">Your growth plan builds here</h2>
            <p className="text-sm text-foreground-3 max-w-xs leading-relaxed">
              As you chat with the Growth Director, each phase of your analysis will appear on this side.
            </p>
          </div>
        ) : (
          <div>
            {outputCards.map((card, i) => {
              switch (card.type) {
                case "product":
                  return <ProductAnalysisCard key={i} data={card.data} />;
                case "competitive":
                  return <CompetitiveCard key={i} data={card.data} />;
                case "funnel":
                  return <FunnelCard key={i} data={card.data} />;
                case "workStatement":
                  return <WorkStatementCard key={i} data={card.data} />;
                case "paywall":
                  return <PaywallCard key={i} data={card.data} />;
              }
            })}
            {whatsNext && (
              <div className="mt-2 p-3.5 px-[18px] bg-background-2 border-[1.5px] border-dashed border-border rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background-3 flex items-center justify-center text-sm shrink-0">
                  {whatsNext.icon}
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-0.5">{whatsNext.title}</h4>
                  <p className="text-[11px] text-foreground-3">{whatsNext.desc}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StagePanel;

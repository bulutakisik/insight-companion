import { useRef, useEffect } from "react";
import { OutputCard } from "@/types/conversation";
import ProductAnalysisCard from "./cards/ProductAnalysisCard";
import BusinessModelCard from "./cards/BusinessModelCard";
import ICPProfileCard from "./cards/ICPProfileCard";
import CompetitiveCard from "./cards/CompetitiveCard";
import USPCard from "./cards/USPCard";
import VisionStatementCard from "./cards/VisionStatementCard";
import ChannelsCard from "./cards/ChannelsCard";
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
  whatsNext: WhatsNextData | null;
  companyUrl?: string | null;
}

const StagePanel = ({ outputCards, whatsNext, companyUrl }: StagePanelProps) => {
  const isEmpty = outputCards.length === 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && outputCards.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [outputCards.length, whatsNext]);

  return (
    <div className="bg-background flex flex-col min-h-0 overflow-hidden">
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto scrollbar-thin">
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
                case "product_analysis":
                  return <ProductAnalysisCard key={card.type} data={card.data} companyUrl={companyUrl || undefined} />;
                case "business_model":
                  return <BusinessModelCard key={card.type} data={card.data} />;
                case "icp_profile":
                  return <ICPProfileCard key={card.type} data={card.data} />;
                case "competitive_landscape":
                  return <CompetitiveCard key={card.type} data={card.data} />;
                case "usp":
                  return <USPCard key={card.type} data={card.data} />;
                case "vision_statement":
                  return <VisionStatementCard key={card.type} data={card.data} />;
                case "channels_and_constraints":
                  return <ChannelsCard key={card.type} data={card.data} />;
                case "funnel_diagnosis":
                  return <FunnelCard key={card.type} data={card.data} />;
                case "work_statement":
                  return <WorkStatementCard key={card.type} data={card.data} />;
                case "paywall":
                  return <PaywallCard key={card.type} data={card.data} />;
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

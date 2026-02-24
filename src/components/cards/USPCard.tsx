import { USPData } from "@/types/conversation";

const USPCard = ({ data }: { data: USPData }) => {
  const d = data as any;
  const usps: any[] = d.usps || [];
  const unfairAdvantage = d.unfair_advantage || d.unfairAdvantage || "";

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">💎 Unique Selling Propositions</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        <div className="space-y-2">
          {usps.map((usp: any, i: number) => (
            <div key={i} className="p-3 bg-background border border-border rounded-[10px]">
              <h5 className="text-xs font-semibold mb-0.5">{usp.title}</h5>
              <p className="text-[11px] text-foreground-3 leading-snug">{usp.description}</p>
              {(usp.competitive_context || usp.competitiveContext) && (
                <p className="text-[10px] text-foreground-3 mt-1.5 italic">
                  vs. competitors: {usp.competitive_context || usp.competitiveContext}
                </p>
              )}
            </div>
          ))}
        </div>
        {unfairAdvantage && (
          <div className="mt-3 p-3 bg-success-dim border border-success-border rounded-[10px]">
            <div className="text-[10px] font-mono text-success uppercase mb-1">UNFAIR ADVANTAGE</div>
            <div className="text-xs text-foreground leading-relaxed">{unfairAdvantage}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default USPCard;

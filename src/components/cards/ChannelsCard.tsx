import { ChannelsAndConstraintsData } from "@/types/conversation";

const ChannelsCard = ({ data }: { data: ChannelsAndConstraintsData }) => {
  const d = data as any;
  const channels: any[] = d.current_channels || d.currentChannels || [];
  const failed: string[] = d.failed_experiments || d.failedExperiments || [];
  const budget = d.budget || {};

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">📡 Channels & Constraints</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        {channels.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-2">CURRENT CHANNELS</div>
            <div className="flex flex-wrap gap-1.5">
              {channels.map((ch: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border rounded-[7px] text-[11px] text-foreground-2">
                  <span className="font-semibold">{ch.channel || ch}</span>
                  {ch.contribution && <span className="text-foreground-3">· {ch.contribution}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {failed.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-2">FAILED EXPERIMENTS</div>
            {failed.map((f: string, i: number) => (
              <div key={i} className="text-[11px] text-foreground-2 flex items-start gap-1.5 mb-1">
                <span className="text-danger shrink-0">✕</span> {f}
              </div>
            ))}
          </div>
        )}
        {(budget.monthly_spend || budget.monthlySpend || budget.constraints) && (
          <div className="p-3 bg-background border border-border rounded-[10px]">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-1">BUDGET</div>
            {(budget.monthly_spend || budget.monthlySpend) && (
              <div className="text-xs font-semibold">{budget.monthly_spend || budget.monthlySpend}</div>
            )}
            {budget.constraints && (
              <div className="text-[11px] text-foreground-3 mt-0.5">{budget.constraints}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelsCard;

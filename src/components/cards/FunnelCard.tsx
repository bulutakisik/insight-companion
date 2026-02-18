import { FunnelData } from "@/types/conversation";

interface FunnelCardProps {
  data: FunnelData;
}

const FunnelCard = ({ data }: FunnelCardProps) => {
  console.log('[FunnelCard] data:', JSON.stringify(data));
  const colorClasses = {
    red: {
      bg: "bg-danger-dim",
      border: "border-danger-border",
      label: "text-danger",
      value: "text-danger",
    },
    orange: {
      bg: "bg-warning-dim",
      border: "border-warning-border",
      label: "text-warning",
      value: "text-warning",
    },
    green: {
      bg: "bg-success-dim",
      border: "border-success-border",
      label: "text-success",
      value: "text-success",
    },
  };

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">📊 Funnel Diagnosis</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        <div className="flex gap-1">
          {(data?.stages || []).map((stage) => {
            const c = colorClasses[stage.color];
            return (
              <div
                key={stage.label}
                className={`flex-1 p-3 py-3 text-center rounded-[10px] ${c.bg} border ${c.border}`}
              >
                <div className={`font-mono text-[8px] font-semibold uppercase tracking-wider mb-1 ${c.label}`}>
                  {stage.label}
                </div>
                <div className={`font-mono text-lg font-semibold ${c.value}`}>{stage.value}</div>
                <div className="text-[9px] text-foreground-3 mt-0.5">{stage.sub || stage.subtitle}</div>
              </div>
            );
          })}
        </div>
        {data?.bottleneck && (
          <div className="mt-3.5 p-3 bg-danger-dim border border-danger-border rounded-[10px]">
            <div className="text-xs font-bold text-danger mb-1">{data.bottleneck.title}</div>
            <div className="text-xs text-foreground-2 leading-relaxed">{data.bottleneck.description}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelCard;

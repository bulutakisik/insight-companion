import { BusinessModelData } from "@/types/conversation";

const BusinessModelCard = ({ data }: { data: BusinessModelData }) => {
  const d = data as any;
  const modelType = d.model_type || d.modelType || "Unknown";
  const description = d.description || "";
  const metrics: any[] = d.metrics || [];

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">🏗️ Business Model</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="px-2.5 py-1 bg-background-3 border border-border rounded-lg font-mono text-xs font-bold text-foreground">
            {modelType}
          </span>
        </div>
        <p className="text-xs text-foreground-3 leading-relaxed mb-4">{description}</p>
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m: any, i: number) => (
              <div key={i} className="p-3 bg-background border border-border rounded-[10px]">
                <div className="text-[10px] font-mono text-foreground-3 uppercase mb-1">{m.label}</div>
                <div className="text-sm font-semibold">{m.value || "TBD"}</div>
                {m.benchmark && (
                  <div className="text-[10px] text-foreground-3 mt-0.5">Benchmark: {m.benchmark}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessModelCard;

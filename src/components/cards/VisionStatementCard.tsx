import { VisionStatementData } from "@/types/conversation";

const VisionStatementCard = ({ data }: { data: VisionStatementData }) => {
  const d = data as any;
  const statement = d.statement || "";
  const validationNote = d.validation_note || d.validationNote || "";

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">🧭 Vision Statement</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-warning-dim text-warning border border-warning-border">
          Hypothesis
        </span>
      </div>
      <div className="p-[18px]">
        <blockquote className="text-sm font-medium leading-relaxed border-l-[3px] border-foreground-2 pl-4 py-1 mb-3 italic">
          "{statement}"
        </blockquote>
        {(d.product || d.audience || d.outcome || d.differentiator) && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {d.product && (
              <div className="p-2 bg-background border border-border rounded-lg">
                <div className="text-[9px] font-mono text-foreground-3 uppercase">Product</div>
                <div className="text-[11px] font-semibold">{d.product}</div>
              </div>
            )}
            {d.audience && (
              <div className="p-2 bg-background border border-border rounded-lg">
                <div className="text-[9px] font-mono text-foreground-3 uppercase">Audience</div>
                <div className="text-[11px] font-semibold">{d.audience}</div>
              </div>
            )}
            {d.outcome && (
              <div className="p-2 bg-background border border-border rounded-lg">
                <div className="text-[9px] font-mono text-foreground-3 uppercase">Outcome</div>
                <div className="text-[11px] font-semibold">{d.outcome}</div>
              </div>
            )}
            {d.differentiator && (
              <div className="p-2 bg-background border border-border rounded-lg">
                <div className="text-[9px] font-mono text-foreground-3 uppercase">Differentiator</div>
                <div className="text-[11px] font-semibold">{d.differentiator}</div>
              </div>
            )}
          </div>
        )}
        {validationNote && (
          <div className="p-2.5 bg-warning-dim border border-warning-border rounded-lg text-[11px] text-foreground-2 leading-relaxed">
            📋 {validationNote}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionStatementCard;

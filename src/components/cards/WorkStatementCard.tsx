import { WorkStatementData } from "@/types/conversation";

const agentColors: Record<string, string> = {
  pmm: "bg-[#EDE9FE] text-[#7C3AED]",
  seo: "bg-[#E0F2FE] text-[#0284C7]",
  content: "bg-success-dim text-success",
  dev: "bg-warning-dim text-warning",
  growth: "bg-danger-dim text-danger",
  perf: "bg-[#FEF3C7] text-[#B45309]",
  social: "bg-[#ECFDF5] text-[#059669]",
  intern: "bg-background-4 text-foreground-3",
};

interface WorkStatementCardProps {
  data: WorkStatementData;
}

const WorkStatementCard = ({ data }: WorkStatementCardProps) => {
  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">📋 1-Month Work Statement</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        {data.sprints.map((sprint, i) => (
          <div key={sprint.number} className={`py-3.5 ${i < data.sprints.length - 1 ? "border-b border-background-3" : ""}`}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-[10px] font-bold text-foreground-3">{sprint.number}</span>
              <span className="text-[13px] font-semibold">{sprint.title}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sprint.tasks.map((task, ti) => (
                <div key={ti} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border rounded-[7px] text-[11px] text-foreground-2">
                  <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase ${agentColors[task.agentClass] || ""}`}>
                    {task.agent}
                  </span>
                  {task.task}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkStatementCard;

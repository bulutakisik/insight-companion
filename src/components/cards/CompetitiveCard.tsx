import { CompetitiveData } from "@/types/conversation";

interface CompetitiveCardProps {
  data: CompetitiveData;
}

const CompetitiveCard = ({ data }: CompetitiveCardProps) => {
  const statusClass = (status?: string) => {
    if (status === "win") return "text-success font-semibold";
    if (status === "lose") return "text-danger font-semibold";
    if (status === "mid") return "text-warning font-semibold";
    return "text-foreground-2";
  };

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">⚔️ Competitive Landscape</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {data.headers.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground-3 border-b border-border bg-background"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri}>
                <td className="px-2.5 py-2 border-b border-background-3 font-semibold text-foreground">
                  {row.metric}
                </td>
                {row.values.map((v, vi) => (
                  <td key={vi} className={`px-2.5 py-2 border-b border-background-3 ${statusClass(v.status)}`}>
                    {v.text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompetitiveCard;

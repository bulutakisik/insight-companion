import { CompetitiveData } from "@/types/conversation";

interface CompetitiveCardProps {
  data: CompetitiveData;
}

const CompetitiveCard = ({ data }: CompetitiveCardProps) => {
  console.log('[CompetitiveCard] data:', JSON.stringify(data));
  const d = data as any;

  const statusClass = (status?: string) => {
    if (status === "win") return "text-success font-semibold";
    if (status === "lose") return "text-danger font-semibold";
    if (status === "mid") return "text-warning font-semibold";
    return "text-foreground-2";
  };

  // Build headers: support both data.headers array and data.competitors array
  const headers: string[] = d.headers
    ? d.headers
    : ['Dimension', 'You', ...(d.competitors || [])];

  // Normalize rows: support both row.metric and row.dimension, both array and object values
  const rows: any[] = (d.rows || []).map((row: any) => {
    const metric = row.metric || row.dimension || '';
    let cells: { text: string; status?: string }[] = [];

    if (Array.isArray(row.values)) {
      cells = row.values.map((v: any) => ({
        text: v.text || v.value || '',
        status: v.status,
      }));
    } else if (row.values && typeof row.values === 'object') {
      // Object keyed by company name — "client" first, then competitors in order
      const clientVal = row.values.client || row.values.Client;
      if (clientVal) {
        cells.push({ text: clientVal.value || clientVal.text || '', status: clientVal.status });
      }
      for (const comp of (d.competitors || [])) {
        const val = row.values[comp];
        if (val) {
          cells.push({ text: val.value || val.text || '', status: val.status });
        }
      }
    }

    return { metric, cells };
  });

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
              {headers.map((h: string, i: number) => (
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
            {rows.map((row: any, ri: number) => (
              <tr key={ri}>
                <td className="px-2.5 py-2 border-b border-background-3 font-semibold text-foreground">
                  {row.metric}
                </td>
                {row.cells.map((cell: any, ci: number) => (
                  <td key={ci} className={`px-2.5 py-2 border-b border-background-3 ${statusClass(cell.status)}`}>
                    {cell.text}
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

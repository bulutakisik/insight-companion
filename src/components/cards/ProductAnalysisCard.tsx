import { ProductAnalysisData } from "@/types/conversation";

interface ProductAnalysisCardProps {
  data: ProductAnalysisData;
}

const ProductAnalysisCard = ({ data }: ProductAnalysisCardProps) => {
  console.log('[ProductAnalysisCard] data:', JSON.stringify(data));
  // Support both nested {company:{name,description,tags}} and flat {company:"Name",description,tags}
  const d = data as any;
  const companyName = typeof d.company === 'string' ? d.company : d.company?.name ?? '';
  const logo = typeof d.company === 'object' ? d.company?.logo : '';
  const description = typeof d.company === 'object' ? d.company?.description : d.description ?? '';
  const tags: string[] = typeof d.company === 'object' ? (d.company?.tags || []) : (d.tags || []);
  const modules: any[] = typeof d.company === 'object' ? (d.modules || []) : (d.modules || []);

  const firstLetter = companyName ? companyName.charAt(0).toUpperCase() : '?';

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">📋 Product Deep Dive</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        <div className="flex gap-3.5 items-start">
          <div className="w-11 h-11 rounded-[11px] bg-background-3 border border-border flex items-center justify-center font-mono text-base font-bold text-foreground-2 shrink-0">
            {logo || firstLetter}
          </div>
          <div>
            <h4 className="text-[15px] font-semibold mb-0.5">{companyName}</h4>
            <p className="text-xs text-foreground-3 leading-relaxed">{description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-background-3 border border-border rounded-md font-mono text-[10px] text-foreground-2">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {modules.map((mod: any) => {
            const modType = mod.type || mod.tag || '';
            const isUnique = modType === 'unique' || modType === 'new';
            return (
              <div key={mod.name} className="p-3 bg-background border border-border rounded-[10px]">
                <h5 className="text-xs font-semibold mb-0.5">{mod.name}</h5>
                <p className="text-[11px] text-foreground-3 leading-snug">{mod.description}</p>
                <span
                  className={`inline-block mt-1.5 px-[7px] py-0.5 rounded font-mono text-[9px] font-semibold uppercase ${
                    isUnique
                      ? "bg-success-dim text-success border border-success-border"
                      : "bg-background-3 text-foreground-3 border border-border"
                  }`}
                >
                  {modType}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysisCard;

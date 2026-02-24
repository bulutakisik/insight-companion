import { ProductAnalysisData } from "@/types/conversation";
import { useState } from "react";

interface ProductAnalysisCardProps {
  data: ProductAnalysisData;
  companyUrl?: string;
}

const ProductAnalysisCard = ({ data, companyUrl }: ProductAnalysisCardProps) => {
  const d = data as any;

  // Extract company name from various shapes
  const companyName = d.company_name || (typeof d.company === 'string' ? d.company : d.company?.name) || d.name || '';
  const description = d.description || d.category || (typeof d.company === 'object' ? d.company?.description : '') || '';
  const website = d.website || companyUrl || '';

  // Extract domain for favicon
  const domain = website
    ? website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : companyUrl?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '';

  const [faviconError, setFaviconError] = useState(false);
  const firstLetter = companyName ? companyName.charAt(0).toUpperCase() : '?';

  // Build tags from various sources
  const rawTags: string[] = d.tags || d.company?.tags || [];
  // Also extract category as tags if present
  if (d.category && rawTags.length === 0) {
    rawTags.push(...d.category.split(/[—\/,]/).map((s: string) => s.trim()).filter(Boolean));
  }

  // Extract modules/features
  const modules: any[] = d.modules || d.features || [];

  // Collect all interesting metadata fields
  const metaFields: { label: string; value: string }[] = [];
  const metaKeys = [
    'funding', 'founded', 'hq', 'employees', 'tech_stack', 'pricing_model',
    'estimated_revenue', 'g2_rating', 'gartner', 'frost_sullivan',
    'founders', 'investors', 'customers', 'key_partnerships',
    'key_differentiators', 'traction', 'pricing', 'team_size',
  ];
  for (const key of metaKeys) {
    const val = d[key];
    if (val && typeof val === 'string') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      metaFields.push({ label, value: val });
    }
  }

  // Product description (longer form)
  const product = d.product || '';

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">👀 My First Glimpse About You</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Snapshot
        </span>
      </div>
      <div className="p-[18px]">
        {/* Company header */}
        <div className="flex gap-3.5 items-start">
          <div className="w-11 h-11 rounded-[11px] bg-background-3 border border-border flex items-center justify-center font-mono text-base font-bold text-foreground-2 shrink-0 overflow-hidden">
            {domain && !faviconError ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt={companyName}
                className="w-full h-full object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : (
              firstLetter
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-[15px] font-semibold mb-0.5">{companyName}</h4>
            {description && (
              <p className="text-xs text-foreground-3 leading-relaxed">{description}</p>
            )}
            {rawTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {rawTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-background-3 border border-border rounded-md font-mono text-[10px] text-foreground-2">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product description */}
        {product && (
          <div className="mt-4 p-3 bg-background border border-border rounded-[10px]">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-1">Product</div>
            <p className="text-xs text-foreground-2 leading-relaxed">{product}</p>
          </div>
        )}

        {/* Modules grid */}
        {modules.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {modules.map((mod: any) => {
              const modType = mod.type || mod.tag || '';
              const isHighlight = modType === 'unique' || modType === 'new' || modType === 'ai';
              return (
                <div key={mod.name} className="p-3 bg-background border border-border rounded-[10px]">
                  <h5 className="text-xs font-semibold mb-0.5">{mod.name}</h5>
                  <p className="text-[11px] text-foreground-3 leading-snug">{mod.description}</p>
                  {modType && (
                    <span
                      className={`inline-block mt-1.5 px-[7px] py-0.5 rounded font-mono text-[9px] font-semibold uppercase ${
                        isHighlight
                          ? "bg-success-dim text-success border border-success-border"
                          : "bg-background-3 text-foreground-3 border border-border"
                      }`}
                    >
                      {modType}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Metadata grid */}
        {metaFields.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {metaFields.map((f) => (
              <div key={f.label} className="p-2.5 bg-background border border-border rounded-[10px]">
                <div className="text-[10px] font-mono text-foreground-3 uppercase mb-0.5">{f.label}</div>
                <div className="text-xs font-semibold leading-relaxed">{f.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAnalysisCard;

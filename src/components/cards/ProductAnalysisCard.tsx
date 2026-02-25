import { ProductAnalysisData } from "@/types/conversation";
import { useState } from "react";

interface ProductAnalysisCardProps {
  data: ProductAnalysisData;
  companyUrl?: string;
}

const ProductAnalysisCard = ({ data, companyUrl }: ProductAnalysisCardProps) => {
  const d = data as any;

  const companyName = d.company_name || (typeof d.company === 'string' ? d.company : d.company?.name) || d.name || '';
  const description = d.description || d.category || (typeof d.company === 'object' ? d.company?.description : '') || '';
  const website = d.website || companyUrl || '';

  const domain = website
    ? website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : companyUrl?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '';

  const [faviconError, setFaviconError] = useState(false);
  const firstLetter = companyName ? companyName.charAt(0).toUpperCase() : '?';

  const rawTags: string[] = d.tags || d.company?.tags || [];
  if (d.category && rawTags.length === 0) {
    rawTags.push(...d.category.split(/[—\/,]/).map((s: string) => s.trim()).filter(Boolean));
  }

  // Extract features as a string or array
  const featuresRaw = d.features || d.modules || [];
  const featureNames: string[] = Array.isArray(featuresRaw)
    ? featuresRaw.map((f: any) => typeof f === 'string' ? f : f.name || '').filter(Boolean)
    : typeof featuresRaw === 'string' ? [featuresRaw] : [];

  // Metadata: only pricing_model, tech_stack, social_media
  const pricingModel = d.pricing_model || d.pricing || '';
  const techStack = d.tech_stack || '';
  const socialMedia = d.social_media || '';

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

        {/* Features — full width */}
        {featureNames.length > 0 && (
          <div className="mt-3 p-3 bg-background border border-border rounded-[10px]">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-1.5">Features</div>
            <div className="flex flex-wrap gap-1.5">
              {featureNames.map((name) => (
                <span key={name} className="px-2 py-0.5 bg-background-3 border border-border rounded-md text-[11px] font-medium text-foreground-2">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Model + Tech Stack — half width each */}
        {(pricingModel || techStack) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {pricingModel && (
              <div className="p-2.5 bg-background border border-border rounded-[10px]">
                <div className="text-[10px] font-mono text-foreground-3 uppercase mb-0.5">Pricing Model</div>
                <div className="text-xs font-semibold leading-relaxed">{pricingModel}</div>
              </div>
            )}
            {techStack && (
              <div className="p-2.5 bg-background border border-border rounded-[10px]">
                <div className="text-[10px] font-mono text-foreground-3 uppercase mb-0.5">Tech Stack</div>
                <div className="text-xs font-semibold leading-relaxed">{techStack}</div>
              </div>
            )}
          </div>
        )}

        {/* Social Media — full width */}
        {socialMedia && (
          <div className="mt-3 p-3 bg-background border border-border rounded-[10px]">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-0.5">Social Media</div>
            <div className="text-xs font-semibold leading-relaxed">{socialMedia}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAnalysisCard;

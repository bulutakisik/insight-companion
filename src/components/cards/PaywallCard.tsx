import { PaywallData } from "@/types/conversation";

interface PaywallCardProps {
  data: PaywallData;
}

const PaywallCard = ({ data }: PaywallCardProps) => {
  console.log('[PaywallCard] data:', JSON.stringify(data));
  return (
    <div className="bg-background-2 border-2 border-primary rounded-2xl p-7 text-center mt-4 animate-fade-up">
      <h3 className="font-serif text-[22px] font-normal mb-2">{data.title}</h3>
      <p className="text-[13px] text-foreground-3 mb-5 leading-relaxed whitespace-pre-line">{data.description}</p>
      <button className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-[10px] transition-all hover:bg-accent hover:-translate-y-px">
        {data.ctaText}
      </button>
      <div className="font-mono text-[11px] text-foreground-3 mt-3">{data.price}</div>
    </div>
  );
};

export default PaywallCard;

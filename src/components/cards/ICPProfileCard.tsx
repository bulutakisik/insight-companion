import { ICPProfileData } from "@/types/conversation";

const ICPProfileCard = ({ data }: { data: ICPProfileData }) => {
  const d = data as any;
  const primary = d.primary_persona || d.primaryPersona || {};
  const secondary = d.secondary_persona || d.secondaryPersona || null;
  const userVsBuyer = d.user_vs_buyer || d.userVsBuyer || "";

  const PersonaBlock = ({ persona, label }: { persona: any; label: string }) => (
    <div className="p-3 bg-background border border-border rounded-[10px]">
      <div className="text-[10px] font-mono text-foreground-3 uppercase mb-2">{label}</div>
      <div className="text-xs font-semibold mb-1">{persona.title || "Unknown"}</div>
      <div className="text-[11px] text-foreground-3 mb-1">{persona.company_size || persona.companySize || ""} · {persona.industry || ""}</div>
      {(persona.pain_points || persona.painPoints || []).length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] font-mono text-foreground-3 mb-1">PAIN POINTS</div>
          {(persona.pain_points || persona.painPoints || []).map((p: string, i: number) => (
            <div key={i} className="text-[11px] text-foreground-2 flex items-start gap-1.5 mb-0.5">
              <span className="text-danger shrink-0">•</span> {p}
            </div>
          ))}
        </div>
      )}
      {(persona.buying_triggers || persona.buyingTriggers || []).length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] font-mono text-foreground-3 mb-1">BUYING TRIGGERS</div>
          {(persona.buying_triggers || persona.buyingTriggers || []).map((t: string, i: number) => (
            <div key={i} className="text-[11px] text-foreground-2 flex items-start gap-1.5 mb-0.5">
              <span className="text-success shrink-0">→</span> {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-background-2 border border-border rounded-2xl mb-4 overflow-hidden animate-fade-up">
      <div className="px-[18px] py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13px] font-bold flex items-center gap-2">🎯 Ideal Customer Profile</h3>
        <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-[5px] uppercase bg-success-dim text-success border border-success-border">
          Complete
        </span>
      </div>
      <div className="p-[18px]">
        <div className="grid gap-2">
          <PersonaBlock persona={primary} label="Primary Persona" />
          {secondary && <PersonaBlock persona={secondary} label="Secondary Persona" />}
        </div>
        {userVsBuyer && (
          <div className="mt-3 p-3 bg-background border border-border rounded-[10px]">
            <div className="text-[10px] font-mono text-foreground-3 uppercase mb-1">USER VS. BUYER</div>
            <div className="text-[11px] text-foreground-2 leading-relaxed">{userVsBuyer}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ICPProfileCard;

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PaywallData } from "@/types/conversation";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PaywallCardProps {
  data: PaywallData;
}

const PaywallCard = ({ data }: PaywallCardProps) => {
  const [open, setOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const d = data as any;
  const headline = d?.title || d?.headline || "Your growth team is ready";
  const ctaText = d?.ctaText || d?.cta?.text || d?.cta || "Start Sprint 1 →";
  const description =
    d?.description ||
    "The world's first humanless agentic growth team.\n8 AI agents. Weekly sprints. Real deliverables.";
  const price = d?.price || "$499/month · All agents · Cancel anytime";

  const handleSimulatePayment = async () => {
    setSimulating(true);
    const sessionId = searchParams.get("session");
    if (sessionId) {
      // Mark session as paid
      await supabase
        .from("growth_sessions")
        .update({ paid: true } as any)
        .eq("id", sessionId);

      // Read output_cards to seed sprint_tasks
      const { data: sessionData } = await supabase
        .from("growth_sessions")
        .select("output_cards")
        .eq("id", sessionId)
        .single();

      if (sessionData?.output_cards) {
        const cards = sessionData.output_cards as any[];
        const wsCard = cards.find((c: any) => c.type === "work_statement");
        const sprints = wsCard?.data?.sprints || [];

        const rows: any[] = [];
        for (const sprint of sprints) {
          const sprintNum = typeof sprint.number === "number"
            ? sprint.number
            : parseInt(String(sprint.number).replace(/\D/g, ""), 10) || 1;
          for (const task of sprint.tasks || []) {
            rows.push({
              session_id: sessionId,
              sprint_number: sprintNum,
              agent: task.agentClass || task.agent || "Intern",
              task_title: task.task || "Untitled",
              task_description: task.task || "",
              status: "queued",
            });
          }
        }

        if (rows.length > 0) {
          await supabase.from("sprint_tasks").insert(rows);
        }
      }
    }
    navigate("/dashboard" + (sessionId ? `?session=${sessionId}` : ""));
  };

  return (
    <>
      <div className="bg-background-2 border-2 border-primary rounded-2xl p-7 text-center mt-4 animate-fade-up">
        <h3 className="font-serif text-[22px] font-normal mb-2">{headline}</h3>
        <p className="text-[13px] text-foreground-3 mb-5 leading-relaxed whitespace-pre-line">
          {description}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-[10px] transition-all hover:bg-accent hover:-translate-y-px"
        >
          {ctaText}
        </button>
        <div className="font-mono text-[11px] text-foreground-3 mt-3">{price}</div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Payment coming soon</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Payment integration coming soon. For early access, contact us at{" "}
              <a
                href="mailto:hello@growthteam.ai"
                className="text-primary underline underline-offset-2"
              >
                hello@growthteam.ai
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleSimulatePayment}
              disabled={simulating}
              className="w-full px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg transition-all hover:bg-accent disabled:opacity-50"
            >
              {simulating ? "Processing…" : "Simulate Payment"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full px-5 py-2.5 border border-border text-foreground text-sm rounded-lg transition-all hover:bg-muted"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaywallCard;

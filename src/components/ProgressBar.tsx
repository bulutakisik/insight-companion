import { ProgressStep } from "@/types/conversation";

interface ProgressBarProps {
  steps: ProgressStep[];
  visible: boolean;
}

const ProgressBar = ({ steps, visible }: ProgressBarProps) => {
  if (!visible) return null;

  return (
    <div className="p-4 px-6 border-b border-border bg-background-2 shrink-0">
      <div className="flex gap-1">
        {steps.map((step) => (
          <div key={step.id} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full h-[3px] bg-background-4 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  step.state === "done"
                    ? "w-full bg-success"
                    : step.state === "active"
                    ? "w-1/2 bg-primary"
                    : "w-0"
                }`}
              />
            </div>
            <div
              className={`font-mono text-[9px] font-semibold uppercase tracking-wider ${
                step.state === "done"
                  ? "text-success"
                  : step.state === "active"
                  ? "text-foreground"
                  : "text-foreground-4"
              }`}
            >
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;

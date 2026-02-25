import type { SprintTask } from "@/types/dashboard";

interface Props {
  task: SprintTask | null;
  sprintLabel: string;
  onClose: () => void;
}

/** Generate a short, clean filename from the task title (max 50 chars) */
function shortFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
  return slug || "deliverable";
}

const TaskDetailModal = ({ task, sprintLabel, onClose }: Props) => {
  if (!task) return null;

  const statusConfig: Record<string, { text: string; bg: string; color: string }> = {
    completed: { text: "✓ Completed", bg: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" },
    in_progress: { text: "⏳ In Progress", bg: "hsl(var(--dash-orange-light))", color: "hsl(var(--dash-orange))" },
    failed: { text: "✗ Failed", bg: "hsl(0 84% 95%)", color: "hsl(0 84% 60%)" },
    queued: { text: "Queued", bg: "hsl(var(--dash-border-light))", color: "hsl(var(--dash-text-tertiary))" },
  };
  const st = statusConfig[task.status] || statusConfig.queued;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-[600px] max-h-[80vh] overflow-y-auto scrollbar-thin"
        style={{ background: "hsl(var(--dash-card))", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", animation: "modalIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: agent + status + close */}
        <div className="flex items-center justify-between p-5 pb-3 border-b" style={{ borderColor: "hsl(var(--dash-border))" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ background: task.agent.color, border: task.agent.hasBorder ? "1px solid #444" : undefined }}
            >
              {task.agent.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{task.agent.name}</div>
              <div className="text-[11px] truncate" style={{ color: "hsl(var(--dash-text-tertiary))" }}>{task.agent.role}</div>
            </div>
            <span className="ml-2 text-[11px] font-medium px-2.5 py-0.5 rounded-xl whitespace-nowrap shrink-0" style={{ background: st.bg, color: st.color }}>
              {st.text}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base cursor-pointer transition-colors shrink-0 ml-3"
            style={{ border: "1px solid hsl(var(--dash-border))", background: "hsl(var(--dash-bg))", color: "hsl(var(--dash-text-secondary))" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 pt-4">
          {/* Title */}
          <h2
            className="font-dm-serif text-lg tracking-tight mb-4 leading-snug"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {task.title}
          </h2>

          {/* Description */}
          <div className="mb-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Description</div>
            <div className="text-sm leading-relaxed" style={{ color: "hsl(var(--dash-text-secondary))" }}>
              {task.description || "No description provided."}
            </div>
          </div>

          {/* Meta */}
          <div className="mb-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Details</div>
            <div className="grid grid-cols-2 gap-3">
              <MetaItem label="Started" value={task.startedAt ? new Date(task.startedAt).toLocaleString() : "Not started"} />
              <MetaItem label="Completed" value={task.completedAt ? new Date(task.completedAt).toLocaleString() : "—"} />
              <MetaItem label="Sprint" value={`${sprintLabel} · Week 1`} />
              <MetaItem label="Dependencies" value="None" />
            </div>
          </div>

          {/* Deliverables */}
          {task.status === "completed" && (
            <div className="mb-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--dash-text-tertiary))" }}>Deliverables</div>
              {task.deliverables && task.deliverables.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {task.deliverables.map((d: any, i: number) => {
                    const isHtml = d.type === "html" || (d.name || "").endsWith(".html");
                    const displayName = shortFilename(task.title) + (isHtml ? ".pdf" : ".md");

                    return (
                      <div key={i} className="rounded-xl p-4 flex items-center justify-between" style={{ background: "hsl(var(--dash-accent-bg))", border: "1px solid hsl(var(--dash-accent-light))" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">📄</span>
                          <span className="text-[13px] font-semibold truncate">{displayName}</span>
                        </div>
                        <button
                          onClick={() => {
                            const content = d.content || d.url || "";

                            if (isHtml) {
                              // Open styled HTML in new window → browser print → Save as PDF
                              const printWindow = window.open("", "_blank");
                              if (printWindow) {
                                printWindow.document.write(content);
                                printWindow.document.close();
                                printWindow.focus();
                                setTimeout(() => printWindow.print(), 500);
                              }
                            } else {
                              const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = displayName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }
                          }}
                          className="text-[11px] font-semibold px-3 py-1 rounded-lg cursor-pointer shrink-0 ml-3"
                          style={{ background: "hsl(var(--dash-accent-light))", color: "hsl(var(--dash-accent))" }}
                        >
                          {isHtml ? "Save as PDF" : "Download"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl p-4" style={{ background: "hsl(var(--dash-accent-bg))", border: "1px solid hsl(var(--dash-accent-light))" }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xl">📦</span>
                    <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--dash-accent))" }}>Output Files</span>
                  </div>
                  <div className="text-xs" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
                    Deliverables will appear here once generated.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg p-3" style={{ background: "hsl(var(--dash-bg))" }}>
    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "hsl(var(--dash-text-tertiary))" }}>{label}</div>
    <div className="text-[13px] font-semibold">{value}</div>
  </div>
);

export default TaskDetailModal;

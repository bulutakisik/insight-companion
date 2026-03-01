import { useState } from "react";

// ── Types ──
export interface ConversationElement {
  type: "checkbox_group" | "radio_group" | "link_button" | "confirm_button" | "status_indicator" | "info_card" | "post_preview";
  id?: string;
  label?: string;
  options?: { id: string; label: string; icon?: string; description?: string }[];
  url?: string;
  style?: "primary" | "secondary";
  status?: "connected" | "pending" | "not_started" | "failed";
  detail?: string;
  title?: string;
  fields?: { label: string; value: string }[];
  platform?: string;
  content?: string;
  scheduled_time?: string;
}

interface ElementProps {
  element: ConversationElement;
  onSubmit: (elementId: string, value: any) => void;
  disabled?: boolean;
}

// ── Checkbox Group ──
const CheckboxGroup = ({ element, onSubmit, disabled }: ElementProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="mt-2 rounded-lg overflow-hidden" style={{ background: "hsl(var(--dash-border-light))" }}>
      {element.label && (
        <div className="text-[11px] font-semibold px-3 pt-2.5 pb-1" style={{ color: "hsl(var(--dash-text-secondary))" }}>
          {element.label}
        </div>
      )}
      {element.options?.map(opt => (
        <label
          key={opt.id}
          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-black/[0.03]"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.id)}
            onChange={() => toggle(opt.id)}
            disabled={disabled}
            className="w-4 h-4 rounded accent-[hsl(var(--dash-accent))]"
          />
          {opt.icon && <span className="text-sm">{opt.icon}</span>}
          <span className="text-[13px] font-medium">{opt.label}</span>
        </label>
      ))}
      <div className="px-3 pb-2.5 pt-1">
        <button
          onClick={() => onSubmit(element.id || "", selected)}
          disabled={disabled || selected.length === 0}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-md text-white transition-opacity disabled:opacity-40"
          style={{ background: "hsl(var(--dash-accent))" }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

// ── Radio Group ──
const RadioGroup = ({ element, onSubmit, disabled }: ElementProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (disabled) return;
    setSelected(id);
    onSubmit(element.id || "", id);
  };

  return (
    <div className="mt-2 rounded-lg overflow-hidden flex flex-col gap-1.5">
      {element.label && (
        <div className="text-[11px] font-semibold pb-1" style={{ color: "hsl(var(--dash-text-secondary))" }}>
          {element.label}
        </div>
      )}
      {element.options?.map(opt => (
        <button
          key={opt.id}
          onClick={() => handleSelect(opt.id)}
          disabled={disabled}
          className="text-left px-3 py-2.5 rounded-lg transition-all"
          style={{
            background: "hsl(var(--dash-border-light))",
            border: selected === opt.id ? "2px solid hsl(var(--dash-accent))" : "2px solid transparent",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: selected === opt.id ? "hsl(var(--dash-accent))" : "hsl(var(--dash-text-tertiary))" }}
            >
              {selected === opt.id && (
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--dash-accent))" }} />
              )}
            </div>
            <span className="text-[13px] font-semibold">{opt.label}</span>
          </div>
          {opt.description && (
            <div className="text-[11px] ml-6 mt-0.5" style={{ color: "hsl(var(--dash-text-secondary))" }}>
              {opt.description}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// ── Link Button ──
const LinkButton = ({ element, disabled }: ElementProps) => {
  const [clicked, setClicked] = useState(false);
  const isPrimary = element.style === "primary";

  return (
    <a
      href={element.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setClicked(true)}
      className={`mt-2 block text-center text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-all ${disabled ? "pointer-events-none opacity-50" : ""}`}
      style={isPrimary ? {
        background: "hsl(var(--dash-accent))",
        color: "white",
      } : {
        background: "white",
        border: "1px solid hsl(var(--dash-border))",
        color: "hsl(var(--foreground))",
      }}
    >
      {clicked ? "Opened — complete authorization in the new tab" : element.label}
    </a>
  );
};

// ── Confirm Button ──
const ConfirmButton = ({ element, onSubmit, disabled }: ElementProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const isPrimary = element.style === "primary";

  const handleClick = () => {
    if (disabled || confirmed) return;
    setConfirmed(true);
    onSubmit(element.id || "", true);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || confirmed}
      className="mt-2 w-full text-[13px] font-semibold px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
      style={isPrimary ? {
        background: confirmed ? "hsl(var(--dash-accent-light))" : "hsl(var(--dash-accent))",
        color: confirmed ? "hsl(var(--dash-accent))" : "white",
      } : {
        background: "white",
        border: "1px solid hsl(var(--dash-border))",
        color: "hsl(var(--foreground))",
      }}
    >
      {confirmed ? "✓ Confirmed" : element.label}
    </button>
  );
};

// ── Status Indicator ──
const StatusIndicator = ({ element }: ElementProps) => {
  const icons: Record<string, string> = {
    connected: "✅",
    pending: "⏳",
    not_started: "○",
    failed: "❌",
  };

  return (
    <div
      className="mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
      style={{ background: "hsl(var(--dash-border-light))", border: "1px solid hsl(var(--dash-border))" }}
    >
      <span className="text-sm">{icons[element.status || "not_started"]}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{element.label}</div>
        {element.detail && (
          <div className="text-[11px]" style={{ color: "hsl(var(--dash-text-secondary))" }}>{element.detail}</div>
        )}
      </div>
    </div>
  );
};

// ── Info Card ──
const InfoCard = ({ element }: ElementProps) => (
  <div
    className="mt-2 rounded-lg px-3.5 py-3"
    style={{ background: "hsl(var(--dash-accent-bg))", border: "1px solid hsl(var(--dash-accent-light))" }}
  >
    {element.title && <div className="text-[14px] font-bold mb-2">{element.title}</div>}
    {element.fields?.map((f, i) => (
      <div key={i} className="mb-1.5 last:mb-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--dash-text-tertiary))" }}>
          {f.label}
        </div>
        <div className="text-[13px]">{f.value}</div>
      </div>
    ))}
  </div>
);

// ── Post Preview ──
const platformColors: Record<string, string> = {
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  instagram: "#E4405F",
  facebook: "#1877F2",
};

const PostPreview = ({ element, onSubmit }: ElementProps) => {
  const color = platformColors[element.platform || ""] || "#6B7280";
  const platformName = (element.platform || "").charAt(0).toUpperCase() + (element.platform || "").slice(1);

  return (
    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--dash-border))" }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid hsl(var(--dash-border))" }}>
        <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: color }}>
          {platformName[0]}
        </div>
        <span className="text-[12px] font-semibold flex-1">{platformName}</span>
        {element.scheduled_time && (
          <span className="text-[10px]" style={{ color: "hsl(var(--dash-text-tertiary))" }}>{element.scheduled_time}</span>
        )}
      </div>
      <div
        className="px-3 py-2.5 text-[13px] leading-relaxed"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {element.content}
      </div>
      <div className="flex gap-2 px-3 py-2" style={{ borderTop: "1px solid hsl(var(--dash-border))" }}>
        <button
          onClick={() => onSubmit(element.id || "post_action", "approve")}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-white"
          style={{ background: "hsl(var(--dash-accent))" }}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onSubmit(element.id || "post_action", "edit")}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
          style={{ background: "hsl(var(--dash-border-light))", color: "hsl(var(--dash-text-secondary))" }}
        >
          ✎ Edit
        </button>
        <button
          onClick={() => onSubmit(element.id || "post_action", "skip")}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
          style={{ background: "hsl(0 84% 95%)", color: "hsl(0 84% 60%)" }}
        >
          ✕ Skip
        </button>
      </div>
    </div>
  );
};

// ── Renderer ──
const InteractiveElement = ({ element, onSubmit, disabled }: ElementProps) => {
  switch (element.type) {
    case "checkbox_group": return <CheckboxGroup element={element} onSubmit={onSubmit} disabled={disabled} />;
    case "radio_group": return <RadioGroup element={element} onSubmit={onSubmit} disabled={disabled} />;
    case "link_button": return <LinkButton element={element} onSubmit={onSubmit} disabled={disabled} />;
    case "confirm_button": return <ConfirmButton element={element} onSubmit={onSubmit} disabled={disabled} />;
    case "status_indicator": return <StatusIndicator element={element} onSubmit={onSubmit} disabled={disabled} />;
    case "info_card": return <InfoCard element={element} onSubmit={onSubmit} disabled={disabled} />;
    case "post_preview": return <PostPreview element={element} onSubmit={onSubmit} disabled={disabled} />;
    default: return null;
  }
};

export default InteractiveElement;

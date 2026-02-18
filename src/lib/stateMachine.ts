import { ConversationPhase, ProgressStep } from "@/types/conversation";

export const INITIAL_PROGRESS_STEPS: ProgressStep[] = [
  { id: 1, label: "Product", state: "pending" },
  { id: 2, label: "Competitors", state: "pending" },
  { id: 3, label: "Checkpoint", state: "pending" },
  { id: 4, label: "Numbers", state: "pending" },
  { id: 5, label: "Work Statement", state: "pending" },
];

export function getPlaceholderForPhase(phase: ConversationPhase): string {
  switch (phase) {
    case 0: return "Enter your website URL...";
    case 1: return "Type your feedback...";
    case 2: return "Share your numbers...";
    case 3: return "";
  }
}

export function isInputDisabledForPhase(phase: ConversationPhase): boolean {
  return phase === 3;
}

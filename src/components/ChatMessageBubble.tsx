import { ChatMessage } from "@/types/conversation";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function markdownToHtml(text: string): string {
  // Convert **bold** to <strong>
  let html = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Convert double newlines to paragraph breaks
  html = html.replace(/\n\n/g, "</p><p>");
  // Convert single newlines to <br>
  html = html.replace(/\n/g, "<br>");
  // Wrap in <p> if we added paragraph breaks
  if (html.includes("</p><p>")) {
    html = "<p>" + html + "</p>";
  }
  return html;
}

const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isUser = message.sender === "user";
  const renderedHtml = isUser ? message.html : markdownToHtml(message.html);

  return (
    <div className={`mb-5 animate-fade-up ${isUser ? "" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
            isUser
              ? "bg-background-3 border border-border text-foreground-2"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isUser ? "You" : "GD"}
        </div>
        <div className="text-[13px] font-semibold">
          {isUser ? "You" : "Growth Director"}
        </div>
      </div>
      <div
        className={`pl-9 text-sm leading-7 whitespace-pre-wrap ${
          isUser
            ? ""
            : "text-foreground-2"
        }`}
      >
      {isUser ? (
          <div className="bg-background-3 border border-border px-4 py-3 rounded-xl inline-block text-foreground">
            <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        ) : (
          <div>
            <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageBubble;

export type StreamEvent =
  | { type: "chat_text"; text: string }
  | { type: "stream_item"; icon: string; text: string }
  | { type: "stream_complete"; summary: string }
  | { type: "output"; outputType: string; data: any }
  | { type: "progress"; step: number; state: "active" | "done" }
  | { type: "whats_next"; icon: string; title: string; desc: string }
  | { type: "whats_next_clear" }
  | { type: "done" };

export function parseStreamChunk(
  buffer: string,
  chunk: string
): { events: StreamEvent[]; remainingBuffer: string } {
  let combined = buffer + chunk;
  const events: StreamEvent[] = [];

  // Debug: log raw stream content
  if (chunk) {
    console.log("[StreamParser] raw chunk:", JSON.stringify(chunk));
  }
  if (combined.includes("<output") || combined.includes("<stream_block") || combined.includes("<stream_item")) {
    console.log("[StreamParser] detected XML tag in combined buffer, length:", combined.length);
  }

  // Extract complete stream blocks
  const streamBlockRegex = /<stream_block>([\s\S]*?)<\/stream_block>/g;
  let match;
  while ((match = streamBlockRegex.exec(combined)) !== null) {
    const blockContent = match[1];

    const itemRegex = /<stream_item icon="([^"]+)">([\s\S]*?)<\/stream_item>/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(blockContent)) !== null) {
      events.push({ type: "stream_item", icon: itemMatch[1], text: itemMatch[2].trim() });
    }

    const completeRegex = /<stream_complete>([\s\S]*?)<\/stream_complete>/g;
    let completeMatch;
    while ((completeMatch = completeRegex.exec(blockContent)) !== null) {
      events.push({ type: "stream_complete", summary: completeMatch[1].trim() });
    }

    combined = combined.replace(match[0], "");
  }

  // Extract complete output blocks (handle both </output> and </o> closing tags)
  const outputRegex = /<output type="([^"]+)">([\s\S]*?)<\/(?:output|o)>/g;
  while ((match = outputRegex.exec(combined)) !== null) {
    console.log("[StreamParser] matched output block type:", match[1], "data length:", match[2].trim().length);
    try {
      const data = JSON.parse(match[2].trim());
      events.push({ type: "output", outputType: match[1], data });
    } catch (e) {
      console.error("Failed to parse output JSON:", e);
    }
    combined = combined.replace(match[0], "");
  }

  // Extract progress tags
  const progressRegex = /<progress step="(\d+)" state="(active|done)"\/>/g;
  while ((match = progressRegex.exec(combined)) !== null) {
    events.push({ type: "progress", step: parseInt(match[1]), state: match[2] as "active" | "done" });
    combined = combined.replace(match[0], "");
  }

  // Extract whats_next tags
  const whatsNextClearRegex = /<whats_next clear="true"\/>/g;
  while ((match = whatsNextClearRegex.exec(combined)) !== null) {
    events.push({ type: "whats_next_clear" });
    combined = combined.replace(match[0], "");
  }

  const whatsNextRegex = /<whats_next icon="([^"]+)" title="([^"]+)" desc="([^"]+)"\/>/g;
  while ((match = whatsNextRegex.exec(combined)) !== null) {
    events.push({ type: "whats_next", icon: match[1], title: match[2], desc: match[3] });
    combined = combined.replace(match[0], "");
  }

  // Determine remaining buffer (incomplete tags) — also match </o> closing
  const incompleteTagRegex = /<(?:stream_block|output|progress|whats_next)(?:(?!<\/(?:stream_block|output|o)>|\/\s*>)[\s\S])*$/;
  const incompleteMatch = combined.match(incompleteTagRegex);

  let remainingBuffer = "";
  let chatText = combined;

  if (incompleteMatch) {
    remainingBuffer = incompleteMatch[0];
    chatText = combined.slice(0, incompleteMatch.index);
  }

  // Emit chat text preserving all whitespace — do NOT trim individual chunks
  if (chatText) {
    events.push({ type: "chat_text", text: chatText });
  }

  return { events, remainingBuffer };
}

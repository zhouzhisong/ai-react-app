type Role = "user" | "assistant";

interface StreamChatOptions {
  query: string;
  model: string;
  // messages:strinng[]
  onMessage: (delta: string) => void;
  onFinish: (fullMessage: string) => void;
  onError?: (err: Error) => void;
}

export async function fetchLLMStream({
  query,
  model,
  onMessage,
  onFinish,
  onError,
}: StreamChatOptions) {
  let fullText = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, model }),
    });

    if (!response.body) throw new Error("无响应流");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          if (part.startsWith("data: ")) {
            try {
              const data = JSON.parse(part.slice(6));
              if (data.content) {
                const delta = data.content
                  .replace(/\\n/g, "\n")
                  .replace(/\\r/g, "\r")
                  .replace(/\\"/g, '"');
                fullText += delta;
                onMessage(delta);
              }
            } catch (err) {
              console.warn("解析 SSE 失败", part);
            }
          }
        }
      }
    }
    onFinish(fullText);
    } catch (error: unknown) {
      console.error("fetchLLMStream error:", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
}

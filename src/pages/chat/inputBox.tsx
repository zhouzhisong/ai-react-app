import { useMemo, useState, useRef, useEffect } from "react";
import { SendHorizonal, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat";
import { fetchLLMStream } from "@/lib/llm/stream";
import { estimateMessagesTokens, estimateTokens } from "@/utils/token";
import { SpeechInput } from "@/components/SpeechRecognition";
import { FileUpload } from "@/components/FileUpload";

interface InputBoxProps {
  sessionId: string | null;
  model: string;
}

export function InputBox({ sessionId, model }: InputBoxProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  //停止服务器请求
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const { addMessage, updateLastMessage } = useChatStore();
  // 在发送前拼接内容
  const fullQuery = fileContent
    ? `以下是用户上传的文件（${fileName}）内容：\n${fileContent}\n\n问题是：${input.trim()}`
    : input.trim();
  const currentSession = useChatStore((state) =>
    sessionId ? state.sessions.find((s) => s.id === sessionId) : undefined
  );

  const messageTokens = useMemo(() => {
    return estimateMessagesTokens(currentSession?.messages ?? []);
  }, [currentSession]);

  const inputTokens = estimateTokens(input);
  const maxToken = currentSession?.model.includes("gpt-4") ? 8192 : 4096;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isSending) return;

    const userMessage = { role: "user" as const, content: input.trim() };
    const assistantMessage = { role: "assistant" as const, content: "" };

    setIsSending(true);
    setInput("");

    const controller = new AbortController(); // 创建中止控制器
    setAbortController(controller);

    try {
      addMessage(sessionId, userMessage);
      addMessage(sessionId, assistantMessage);

      let fullText = "";

      await fetchLLMStream({
        query: fullQuery,
        model,
        signal: controller.signal, // 传入中止控制器
        onMessage: (delta) => {
          fullText += delta;
          updateLastMessage(sessionId, () => ({
            role: "assistant",
            content: fullText,
          }));
        },
        onFinish: () => setIsSending(false),
        onError: (err) => {
          updateLastMessage(sessionId, " 出错了: " + err.message);
          setIsSending(false);
        },
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      setIsSending(false);
    }
  };
  const handleStop = () => {
    abortController?.abort();
    setIsSending(false);
    setAbortController(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="输入内容，按 Enter 发送，Shift + Enter 换行"
          className="w-full resize-none bg-white border border-gray-300 rounded-xl p-3 pr-20 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all"
          disabled={!sessionId || isSending}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
          <FileUpload
            onFileProcessed={(text, name) => {
              setFileContent(text);
              setFileName(name);
              setInput((prev) => `${prev}\n【已附加文件：${name}】`);
            }}
          />

          <SpeechInput onResult={(text) => setInput(text)} />

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending || !sessionId}
            className={cn(
              "text-gray-500 hover:text-black transition disabled:opacity-30",
              isSending && "cursor-wait"
            )}
          >
            <SendHorizonal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground py-2 border-b bg-gray-10">
        <div>
          上下文长度：{currentSession?.messages.length} 条消息 / 约{" "}
          {messageTokens} tokens
        </div>
        <div>
          当前输入：约 {inputTokens} tokens / 最大上下文：{maxToken} tokens
        </div>
      </div>
    </div>
  );
}

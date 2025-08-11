import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chat";
import { marked } from "marked";


interface ChatViewProps {
  sessionId: string | null;
}

export const ChatView = ({ sessionId }: ChatViewProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = sessionId
    ? useChatStore((state) => state.getSessionMessages(sessionId))
    : [];

    

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        请选择或创建一个会话
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="text-center p-8">
          <p>开始你的对话吧</p>
          <p className="text-sm mt-2">选择模型后，输入内容并按Enter发送</p>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {messages.map((msg, id) => (
        <div
          key={id}
          className={`whitespace-pre-wrap rounded-lg px-4 py-3 max-w-2xl ${
            msg.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
          }`}
        >
          <div className="font-medium mb-1 capitalize">{msg.role}</div>
          <div
            style={{
              display: "inline-block",
              maxWidth: "90%",
              background: msg.role === "user" ? "#d2eafd" : "#f3f3f3",
              borderRadius: 6,
              padding: 8,
            }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: marked.parse(msg.content || ""),
              }}
            />
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

// src/pages/ChatPage.tsx
import { useEffect } from "react";
import { models } from "@/lib/models";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/pages/chat/sideBar";
import { ChatView } from "@/pages/chat/chatView";
import { InputBox } from "@/pages/chat/inputBox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useChatStore } from "@/store/chat";

export default function Page() {
  const { 
    currentId, 
    getCurrentSession,
    updateSessionModel,
    createSession
  } = useChatStore();
  
  const selectedSession = getCurrentSession();
  const selectedModel = selectedSession?.model ?? "gpt-3.5-turbo";

  // 初始化默认会话
  useEffect(() => {
    const { sessions } = useChatStore.getState();
    if (sessions.length === 0) {
      createSession();
    }
  }, [createSession]);

  const handleModelChange = (value: string) => {
    if (currentId) {
      updateSessionModel(currentId, value as any);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧边栏 */}
      <aside className="w-64 bg-[#f7f7f8] border-r border-gray-200 p-4 flex flex-col">
        <div className="text-lg font-semibold mb-4 px-2">ChatGPT</div>
        <Sidebar />
      </aside>

      {/* 右侧聊天区域 */}
      <main className="flex-1 flex flex-col bg-white">
        {/* 顶部模型选择器 */}
        <div className="flex justify-end items-center p-4 border-b gap-2">
          <span className="text-sm text-muted-foreground">当前模型：</span>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.label} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto">
          <ChatView sessionId={currentId} />
        </div>
        <div className="border-t border-gray-200 p-4">
          <InputBox sessionId={currentId} model={selectedModel} />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
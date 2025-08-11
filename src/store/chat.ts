import { create } from "zustand";
import { persist } from "zustand/middleware";
import PersistStorage from "zustand";
import type { ModelType } from "@/types/chat";
import { nanoid } from "nanoid";
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
//会话类型
export interface ChatSession {
  id: string;
  title: string;
  model: ModelType;
  messages: Message[];
}

//存储状态
interface ChatStore {
  sessions: ChatSession[];
  currentId: string | null;

  // 会话操作
  createSession: (name?: string, model?: ModelType) => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  updateSessionModel: (id: string, model: ModelType) => void;

  // 消息操作
  addMessage: (
    sessionId: string,
    message: Omit<Message, "id" | "timestamp">
  ) => void;
  clearMessages: (sessionId: string) => void;

  // 辅助方法
  getCurrentSession: () => ChatSession | undefined;
  getSessionMessages: (sessionId: string) => Message[];
  updateLastMessage: (sessionId: string, updater: any) => void;
  updateMessageContent: (messageId: string, newContent: string) => void;
}

// 确保存储的数据是纯JSON类型
const sanitizeSession = (session: ChatSession): ChatSession => ({
  id: session.id,
  title: session.title || "新的会话",
  model: session.model || ("gpt-3.5-turbo" as ModelType),
  messages: session.messages.map((msg) => ({
    id: msg.id,
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content || "",
    timestamp: Number(msg.timestamp) || Date.now(),
  })),
});

const customStorage: PersistStorage<ChatStore> = {
  getItem: (name: string) => {
    try {
      const value = localStorage.getItem(name);
      if (value) {
        const parsed = JSON.parse(value);
        // 验证并清理存储的数据
        if (parsed.state && Array.isArray(parsed.state.sessions)) {
          parsed.state.sessions = parsed.state.sessions.map((s: any) =>
            sanitizeSession(s)
          );
        }
        return parsed;
      }
    } catch (error) {
      console.error("Failed to load storage:", error);
      localStorage.removeItem(name); // 清除损坏的数据
    }
    return null;
  },
  setItem: (name: string, value: any) => {
    try {
      // 只序列化需要的数据
      const safeValue = {
        ...value,
        state: {
          ...value.state,
          sessions: value.state.sessions.map((s: ChatSession) =>
            sanitizeSession(s)
          ),
        },
      };
      localStorage.setItem(name, JSON.stringify(safeValue));
    } catch (error) {
      console.error("Failed to save storage:", error);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

// 聊天存储
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentId: null,

      createSession: (
        name = "新的会话",
        model: ModelType = "gpt-3.5-turbo"
      ) => {
        // 确保模型类型正确
        const validModels: ModelType[] = [
          "gpt-3.5-turbo",
          "gpt-4",
          "deepseek-coder",
        ];
        const finalModel = validModels.includes(model)
          ? model
          : "gpt-3.5-turbo";

        // 使用更安全的ID生成方式
        const id = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log(name);

        const newSession: ChatSession = {
          id,
          title: name.trim() || "新的会话",
          model: finalModel,
          messages: [],
        };

        // 确保状态更新的不可变性
        set((state) => {
          // 防御性检查：确保sessions是数组
          const currentSessions = Array.isArray(state.sessions)
            ? state.sessions
            : [];
          const updatedSessions = [newSession, ...currentSessions];

          return {
            sessions: updatedSessions,
            currentId: id,
          };
        });
      },

      switchSession: (id) => set({ currentId: id }),

      deleteSession: (id) => {
        set((state) => {
          const currentSessions = Array.isArray(state.sessions)
            ? state.sessions
            : [];
          const filtered = currentSessions.filter((s) => s.id !== id);
          const currentId = filtered.length > 0 ? filtered[0].id : null;
          return { sessions: filtered, currentId };
        });
      },

      renameSession: (id, newTitle) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title: newTitle.trim() || s.title } : s
          ),
        }));
      },

      updateSessionModel: (id, model) => {
        const validModels: ModelType[] = [
          "gpt-3.5-turbo",
          "gpt-4",
          "deepseek-coder",
        ];
        if (!validModels.includes(model)) return;

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, model } : s
          ),
        }));
      },
      // 可选：获取当前模型
      getCurrentModel: () => {
        const { currentId, sessions } = get();
        const current = sessions.find((s) => s.id === currentId);
        return current?.model || "gpt-3.5-turbo";
      },
      addMessage: (sessionId, message) => {
        const newMessage: Message = {
          ...message,
          id: `msg-${nanoid()}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...(s.messages || []), newMessage] }
              : s
          ),
        }));
      },

      clearMessages: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messages: [] } : s
          ),
        }));
      },

      getCurrentSession: () => {
        const { sessions, currentId } = get();
        if (!currentId || !Array.isArray(sessions)) return undefined;
        return sessions.find((s) => s.id === currentId);
      },

      getSessionMessages: (sessionId) => {
        const { sessions } = get();
        if (!Array.isArray(sessions)) return [];
        const session = sessions.find((s) => s.id === sessionId);
        return session?.messages || [];
      },
      updateLastMessage: (sessionId: string, updater: any) =>
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (!session) return state;
          const lastIndex = session.messages.length - 1;
          session.messages[lastIndex] = updater(session.messages[lastIndex]);
          return { sessions: [...state.sessions] };
        }),
      updateMessageContent: (messageId, newContent) => {
        set((state) => ({
          sessions: state.sessions.map((session) => ({
            ...session,
            messages: session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content: newContent } : msg
            ),
          })),
        }));
      },
    }),
    {
      name: "chat-storage",
      storage: customStorage,
      // 只持久化需要的数据
      partialize: (state) => ({
        sessions: state.sessions,
        currentId: state.currentId,
      }),
    }
  )
);

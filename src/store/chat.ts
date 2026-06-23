import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type { ModelType } from "@/types/chat";
import { nanoid } from "nanoid";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  model: ModelType;
  messages: Message[];
}

interface ChatStore {
  sessions: ChatSession[];
  currentId: string | null;

  createSession: (name?: string, model?: ModelType) => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  updateSessionModel: (id: string, model: ModelType) => void;

  addMessage: (
    sessionId: string,
    message: Omit<Message, "id" | "timestamp">
  ) => void;
  clearMessages: (sessionId: string) => void;

  getCurrentSession: () => ChatSession | undefined;
  getSessionMessages: (sessionId: string) => Message[];
  updateLastMessage: (
    sessionId: string,
    updater: (msg: Message) => Message
  ) => void;
  updateMessageContent: (messageId: string, newContent: string) => void;
}

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

const customStorage: StateStorage = {
  getItem: (name: string) => {
    try {
      const value = localStorage.getItem(name);
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.state && Array.isArray(parsed.state.sessions)) {
          parsed.state.sessions = parsed.state.sessions.map((s: ChatSession) =>
            sanitizeSession(s)
          );
        }
        return parsed;
      }
    } catch (error) {
      console.error("Failed to load storage:", error);
      localStorage.removeItem(name);
    }
    return null;
  },
  setItem: (name: string, value: string) => {
    try {
      const parsed = JSON.parse(value);
      const safeValue = {
        ...parsed,
        state: {
          ...parsed.state,
          sessions: parsed.state.sessions.map((s: ChatSession) =>
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

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentId: null,

      createSession: (
        name = "新的会话",
        model: ModelType = "gpt-3.5-turbo"
      ) => {
        const validModels: ModelType[] = [
          "gpt-3.5-turbo",
          "gpt-4",
          "deepseek-coder",
        ];
        const finalModel = validModels.includes(model)
          ? model
          : "gpt-3.5-turbo";

        const id = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newSession: ChatSession = {
          id,
          title: name.trim() || "新的会话",
          model: finalModel,
          messages: [],
        };

        set((state) => {
          const currentSessions = Array.isArray(state.sessions)
            ? state.sessions
            : [];
          return {
            sessions: [newSession, ...currentSessions],
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
          return {
            sessions: filtered,
            currentId: filtered.length > 0 ? filtered[0].id : null,
          };
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
        return sessions.find((s) => s.id === sessionId)?.messages || [];
      },

      // 修复：使用不可变更新，避免直接 mutate session.messages
      updateLastMessage: (sessionId, updater) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId || s.messages.length === 0) return s;
            const messages = [...s.messages];
            messages[messages.length - 1] = updater(messages[messages.length - 1]);
            return { ...s, messages };
          }),
        })),

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
      partialize: (state) => ({
        sessions: state.sessions,
        currentId: state.currentId,
      }),
    }
  )
);

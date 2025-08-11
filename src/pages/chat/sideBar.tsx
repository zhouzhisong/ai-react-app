// src/components/chat/sideBar.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { useChatStore } from "@/store/chat";

export const Sidebar = () => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  
  // 从store获取状态和方法
  const { 
    sessions, 
    currentId, 
    createSession, 
    deleteSession, 
    switchSession,
    renameSession
  } = useChatStore();

  const handleRename = (id: string, newTitle: string) => {
    if (newTitle.trim()) {
      renameSession(id, newTitle.trim());
    }
    setEditingId(null);
  };
  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到父元素
    setEditingId(null);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm font-medium">会话列表</span>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => createSession()}
          className="hover:bg-primary/10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {sessions.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground p-4">
            暂无会话，点击上方+创建
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => {
              const isEditing = editingId === session.id;
              const isSelected = currentId === session.id;

              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-secondary font-medium"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => switchSession(session.id)}
                >
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => handleRename(session.id, editTitle)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(session.id, editTitle);
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div
                      className="flex-1 truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditTitle(session.title);
                      }}
                    >
                      {session.title}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditing) {
                          handleRename(session.id, editTitle);
                        } else {
                          setEditingId(session.id);
                          setEditTitle(session.title);
                        }
                      }}
                      className="h-7 w-7"
                    >
                      {isEditing ? (
                        <X className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
};
export type ModelType = "gpt-3.5-turbo" | "gpt-4" | "deepseek-coder"

export interface ChatSession {
  id: string
  title: string
  model: ModelType
}
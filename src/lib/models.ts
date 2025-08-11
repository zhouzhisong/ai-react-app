export const models = [
  {
    label: "GPT-3.5",
    value: "gpt-3.5-turbo",
    provider: "openai",
  },
  {
    label: "GPT-4",
    value: "gpt-4",
    provider: "openai",
  },
  {
    label: "DeepSeek Chat",
    value: "deepseek-chat",
    provider: "deepseek",
  },
  {
    label: "Claude 3",
    value: "claude-3-opus",
    provider: "anthropic",
  },
] as const;

export type ModelType = (typeof models)[number]["value"];

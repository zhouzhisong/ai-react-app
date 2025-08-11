import { encode } from 'gpt-tokenizer'; 

export function estimateTokens(text: string): number {
  return encode(text).length;
}

export function estimateMessagesTokens(messages: { role: string; content: string }[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
}

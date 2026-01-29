export enum SkillMode {
  DASHBOARD = 'dashboard',
  SPEAKING = 'speaking',
  WRITING = 'writing',
  SETTINGS = 'settings'
}

export interface UserStats {
  speakingScore: number[];
  writingScore: number[];
  lessonsCompleted: number;
  streak: number;
  lastPractice: string;
}

export interface FeedbackItem {
  original: string;
  correction: string;
  explanation: string;
  type: 'grammar' | 'vocabulary' | 'pronunciation' | 'coherence';
}

export interface AIResponse {
  score: number;
  scoreBreakdown?: Record<string, number>; // Detailed score criteria
  feedback: string; // General feedback
  detailedErrors: FeedbackItem[];
  improvedVersion?: string; // For writing
  transcription?: string; // For speaking
}

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  audioUrl?: string; // Optional: if we want to play back user audio
}

export interface HistoryItem {
  id: string;
  date: string;
  mode: 'speaking' | 'writing';
  score: number;
  summary: string;
}

// Gemini specific types
export interface GeminiConfig {
  apiKey: string;
}

export type AIModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-2.5-flash';

export interface AIModelConfig {
  selectedModel: AIModelType;
  apiKey: string;
}

export const SUPPORTED_MODELS: { id: AIModelType; name: string; desc: string; isNew?: boolean }[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Fastest, low latency (Default)', isNew: true },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'High intelligence, complex tasks', isNew: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Balanced performance' },
];
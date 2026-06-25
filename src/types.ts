export interface User {
  id: string;
  username: string;
  name: string;
}

export interface WhatsAppSession {
  userId: string;
  status: "Not Connected" | "Connecting" | "Connected" | "Disconnected";
  qrCode: string;
  phone: string;
  name: string;
  lastConnectedAt?: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  tags: string[];
  notes: string;
  lastContactAt: string;
  assignedPersonaId?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  contactPhone: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  aiStatus: "AI" | "Manual" | "Paused";
  unreadCount: number;
  contactId?: string;
  personaId?: string;
  aiEnabled?: boolean;
  manualMode?: boolean;
  customPrompt?: string;
  memorySummary?: string;
  leadStage?: string;
  priority?: "Low" | "Medium" | "High";
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  followUpReminder?: string;
  language?: string;
}

export interface Message {
  id: string;
  userId: string;
  conversationId: string;
  sender: "user" | "contact" | "ai";
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

export interface Persona {
  id: string;
  userId: string;
  name: string;
  description: string;
  systemPrompt: string;
  tone: string;
  isActive: boolean;
}

export interface Settings {
  userId: string;
  businessName: string;
  timezone: string;
  defaultLanguage: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  autoReplyToggle: boolean;
  openaiApiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  replyDelay: number;
  typingDelay: number;
  responseLength: "Short" | "Medium" | "Detailed";
  language: string;
  conversationMemory: number;
  enableMarkdown: boolean;
  enableEmoji: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  defaultPersonaId?: string;
}

export interface Broadcast {
  id: string;
  userId: string;
  name: string;
  messageText: string;
  scheduledAt: string;
  status: "Pending" | "Sending" | "Sent" | "Failed";
  progress: number;
  contactsCount: number;
  sentCount: number;
}

export interface Log {
  id: string;
  userId: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

export interface Analytics {
  userId: string;
  date: string;
  totalMessages: number;
  aiReplies: number;
  humanReplies: number;
  avgResponseTime: number;
}

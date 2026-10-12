import fs from "fs";
import path from "path";
import crypto from "crypto";

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "db-data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Cached, Atomic-Write JSON Store
class JsonStore<T> {
  private cache: T | null = null;

  constructor(private filename: string, private defaultValue: T) {}

  get(): T {
    if (this.cache !== null) return this.cache;
    const filePath = path.join(DATA_DIR, this.filename);
    if (!fs.existsSync(filePath)) {
      this.set(this.defaultValue);
      return this.defaultValue;
    }
    try {
      const content = fs.readFileSync(filePath, "utf8");
      this.cache = JSON.parse(content) as T;
      return this.cache;
    } catch (error) {
      console.error(`Error reading ${this.filename}:`, error);
      return this.defaultValue;
    }
  }

  set(data: T): void {
    this.cache = data;
    const filePath = path.join(DATA_DIR, this.filename);
    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    try {
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      console.error(`Error atomically saving ${this.filename}:`, error);
    }
  }
}

// Types Definition
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  createdAt: string;
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
  replyDelay: number; // in seconds
  typingDelay: number; // in seconds
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
  targetContactIds?: string[];
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

// Stores
const stores = {
  users: new JsonStore<User[]>("users.json", []),
  sessions: new JsonStore<WhatsAppSession[]>("whatsapp_sessions.json", []),
  contacts: new JsonStore<Contact[]>("contacts.json", []),
  conversations: new JsonStore<Conversation[]>("conversations.json", []),
  messages: new JsonStore<Message[]>("messages.json", []),
  personas: new JsonStore<Persona[]>("personas.json", []),
  settings: new JsonStore<Settings[]>("settings.json", []),
  broadcasts: new JsonStore<Broadcast[]>("broadcasts.json", []),
  logs: new JsonStore<Log[]>("logs.json", []),
  analytics: new JsonStore<Analytics[]>("analytics.json", []),
};

export class Database {
  static getUsers(): User[] { return stores.users.get(); }
  static saveUsers(users: User[]): void { stores.users.set(users); }

  static getSessions(): WhatsAppSession[] { return stores.sessions.get(); }
  static saveSessions(sessions: WhatsAppSession[]): void { stores.sessions.set(sessions); }

  static getContacts(): Contact[] { return stores.contacts.get(); }
  static saveContacts(contacts: Contact[]): void { stores.contacts.set(contacts); }

  static getConversations(): Conversation[] { return stores.conversations.get(); }
  static saveConversations(conversations: Conversation[]): void { stores.conversations.set(conversations); }

  static getMessages(): Message[] { return stores.messages.get(); }
  static saveMessages(messages: Message[]): void { stores.messages.set(messages); }

  static getPersonas(): Persona[] { return stores.personas.get(); }
  static savePersonas(personas: Persona[]): void { stores.personas.set(personas); }

  static getSettings(): Settings[] { return stores.settings.get(); }
  static saveSettings(settings: Settings[]): void { stores.settings.set(settings); }

  static getBroadcasts(): Broadcast[] { return stores.broadcasts.get(); }
  static saveBroadcasts(broadcasts: Broadcast[]): void { stores.broadcasts.set(broadcasts); }

  static getLogs(): Log[] { return stores.logs.get(); }
  static saveLogs(logs: Log[]): void { stores.logs.set(logs); }

  static getAnalytics(): Analytics[] { return stores.analytics.get(); }
  static saveAnalytics(analytics: Analytics[]): void { stores.analytics.set(analytics); }

  // Seed default data for a user if not already initialized
  static seedUserData(userId: string): void {
    const allSettings = this.getSettings();
    if (allSettings.some((s) => s.userId === userId)) {
      return; // Already initialized
    }

    const supportPersonaId = `${userId}-persona-support`;
    const salesPersonaId = `${userId}-persona-sales`;
    const techPersonaId = `${userId}-persona-tech`;

    // 1. Personas
    const allPersonas = this.getPersonas();
    const userPersonas = allPersonas.filter((p) => p.userId === userId);
    if (userPersonas.length === 0) {
      allPersonas.push(
        {
          id: supportPersonaId,
          userId,
          name: "Friendly Support",
          description: "Warm, empathetic customer support representative",
          systemPrompt: "You are Friendly Support, a warm, polite and highly empathetic customer support agent. Answer questions concisely and friendly. Ensure the customer feels supported, and guide them clearly.",
          tone: "Friendly, empathetic, polite",
          isActive: true,
        },
        {
          id: salesPersonaId,
          userId,
          name: "Professional Sales",
          description: "High-energy sales executive focused on conversion",
          systemPrompt: "You are Professional Sales, a high-performing sales expert. Your goal is to guide prospects toward scheduling a consultation or buying. Be persuasive, positive, highlight benefits, and close with an action-oriented call to action.",
          tone: "Persuasive, energetic, professional",
          isActive: false,
        },
        {
          id: techPersonaId,
          userId,
          name: "Technical Expert",
          description: "Highly detailed tech support and troubleshooter",
          systemPrompt: "You are Technical Expert, an expert troubleshooter. You provide clear, step-by-step instructions. Keep language clear, precise, and professional. Avoid fluff; focus on factual accuracy.",
          tone: "Factual, precise, structured",
          isActive: false,
        }
      );
      this.savePersonas(allPersonas);
    }

    // 2. Settings
    allSettings.push({
      userId,
      businessName: "My AI Business",
      timezone: "America/New_York",
      defaultLanguage: "en",
      notificationsEnabled: true,
      darkMode: false,
      autoReplyToggle: true,
      openaiApiKey: "",
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxTokens: 500,
      replyDelay: 2,
      typingDelay: 1,
      responseLength: "Medium",
      language: "English",
      conversationMemory: 10,
      enableMarkdown: true,
      enableEmoji: true,
      businessHoursStart: "00:00",
      businessHoursEnd: "23:59",
      defaultPersonaId: supportPersonaId,
    });
    this.saveSettings(allSettings);

    // 3. WhatsApp Session
    const allSessions = this.getSessions();
    if (!allSessions.some((s) => s.userId === userId)) {
      allSessions.push({
        userId,
        status: "Not Connected",
        qrCode: "",
        phone: "",
        name: "",
      });
      this.saveSessions(allSessions);
    }

    // 4. Seed Analytics (Past 7 days)
    const allAnalytics = this.getAnalytics();
    if (!allAnalytics.some((a) => a.userId === userId)) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        allAnalytics.push({
          userId,
          date: d.toISOString().split("T")[0],
          totalMessages: Math.floor(Math.random() * 15) + 5,
          aiReplies: Math.floor(Math.random() * 10) + 3,
          humanReplies: Math.floor(Math.random() * 4),
          avgResponseTime: Math.floor(Math.random() * 4) + 1,
        });
      }
      this.saveAnalytics(allAnalytics);
    }

    // 5. Seed Logs
    const allLogs = this.getLogs();
    if (!allLogs.some((l) => l.userId === userId)) {
      allLogs.push(
        {
          id: crypto.randomUUID(),
          userId,
          type: "info",
          message: "Workspace initialized successfully",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: crypto.randomUUID(),
          userId,
          type: "success",
          message: "Pre-configured AI Engine loaded with model gemini-2.5-flash",
          timestamp: new Date().toISOString(),
        }
      );
      this.saveLogs(allLogs);
    }
  }
}

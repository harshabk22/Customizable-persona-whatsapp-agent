import fs from "fs";
import path from "path";
import crypto from "crypto";

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "db-data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Utility to read/write JSON files safely
function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
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
  conversationMemory: number; // number of messages to remember
  enableMarkdown: boolean;
  enableEmoji: boolean;
  businessHoursStart: string; // "09:00"
  businessHoursEnd: string; // "17:00"
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
  date: string; // YYYY-MM-DD
  totalMessages: number;
  aiReplies: number;
  humanReplies: number;
  avgResponseTime: number; // in seconds
}

// Memory Database Service
export class Database {
  static getUsers(): User[] {
    return readJsonFile<User[]>("users.json", []);
  }

  static saveUsers(users: User[]): void {
    writeJsonFile<User[]>("users.json", users);
  }

  static getSessions(): WhatsAppSession[] {
    return readJsonFile<WhatsAppSession[]>("whatsapp_sessions.json", []);
  }

  static saveSessions(sessions: WhatsAppSession[]): void {
    writeJsonFile<WhatsAppSession[]>("whatsapp_sessions.json", sessions);
  }

  static getContacts(): Contact[] {
    return readJsonFile<Contact[]>("contacts.json", []);
  }

  static saveContacts(contacts: Contact[]): void {
    writeJsonFile<Contact[]>("contacts.json", contacts);
  }

  static getConversations(): Conversation[] {
    return readJsonFile<Conversation[]>("conversations.json", []);
  }

  static saveConversations(conversations: Conversation[]): void {
    writeJsonFile<Conversation[]>("conversations.json", conversations);
  }

  static getMessages(): Message[] {
    return readJsonFile<Message[]>("messages.json", []);
  }

  static saveMessages(messages: Message[]): void {
    writeJsonFile<Message[]>("messages.json", messages);
  }

  static getPersonas(): Persona[] {
    return readJsonFile<Persona[]>("personas.json", []);
  }

  static savePersonas(personas: Persona[]): void {
    writeJsonFile<Persona[]>("personas.json", personas);
  }

  static getSettings(): Settings[] {
    return readJsonFile<Settings[]>("settings.json", []);
  }

  static saveSettings(settings: Settings[]): void {
    writeJsonFile<Settings[]>("settings.json", settings);
  }

  static getBroadcasts(): Broadcast[] {
    return readJsonFile<Broadcast[]>("broadcasts.json", []);
  }

  static saveBroadcasts(broadcasts: Broadcast[]): void {
    writeJsonFile<Broadcast[]>("broadcasts.json", broadcasts);
  }

  static getLogs(): Log[] {
    return readJsonFile<Log[]>("logs.json", []);
  }

  static saveLogs(logs: Log[]): void {
    writeJsonFile<Log[]>("logs.json", logs);
  }

  static getAnalytics(): Analytics[] {
    return readJsonFile<Analytics[]>("analytics.json", []);
  }

  static saveAnalytics(analytics: Analytics[]): void {
    writeJsonFile<Analytics[]>("analytics.json", analytics);
  }

  // Seed default data for a user
  static seedUserData(userId: string): void {
    // 1. Personas (Create first so we have the IDs for settings and conversations)
    const allPersonas = this.getPersonas();
    const userPersonas = allPersonas.filter((p) => p.userId === userId);
    
    const supportPersonaId = `${userId}-persona-support`;
    const salesPersonaId = `${userId}-persona-sales`;
    const techPersonaId = `${userId}-persona-tech`;

    if (userPersonas.length === 0) {
      const defaultPersonas: Persona[] = [
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
        },
      ];
      allPersonas.push(...defaultPersonas);
      this.savePersonas(allPersonas);
    }

    // 2. Settings
    const allSettings = this.getSettings();
    if (!allSettings.some((s) => s.userId === userId)) {
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
        replyDelay: 3,
        typingDelay: 2,
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
    }

    // 3. WhatsApp Session
    const allSessions = this.getSessions();
    const existingSessionIndex = allSessions.findIndex((s) => s.userId === userId);
    if (existingSessionIndex === -1) {
      allSessions.push({
        userId,
        status: "Not Connected",
        qrCode: "",
        phone: "",
        name: "",
      });
      this.saveSessions(allSessions);
    }

    // 5. Seed Analytics (Last 7 days)
    const allAnalytics = this.getAnalytics();
    const userAnalytics = allAnalytics.filter((a) => a.userId === userId);
    if (userAnalytics.length === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        allAnalytics.push({
          userId,
          date: dateStr,
          totalMessages: Math.floor(Math.random() * 15) + 5,
          aiReplies: Math.floor(Math.random() * 10) + 3,
          humanReplies: Math.floor(Math.random() * 4),
          avgResponseTime: Math.floor(Math.random() * 4) + 1,
        });
      }
      this.saveAnalytics(allAnalytics);
    }

    // 6. Seed Logs
    const allLogs = this.getLogs();
    const userLogs = allLogs.filter((l) => l.userId === userId);
    if (userLogs.length === 0) {
      allLogs.push(
        {
          id: crypto.randomUUID(),
          userId,
          type: "info",
          message: "Database initialized successfully for user workspace",
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

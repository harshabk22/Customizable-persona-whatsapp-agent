import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Send, Bot, User, Play, Pause, Power, MessageSquare, 
  Smartphone, Bell, Zap, Info, ShieldAlert, Sparkles, Save, Tag
} from "lucide-react";
import { Conversation, Message, Contact, Persona } from "../types";

interface ConversationsProps {
  token: string;
}

export default function Conversations({ token }: ConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  
  // Real-time state
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Tab selections for right column (Simulator vs Contact Profile Card vs Conversation Settings)
  const [rightTab, setRightTab] = useState<"simulator" | "profile" | "settings">("simulator");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Bulk persona assignment
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPersonaId, setBulkPersonaId] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // Virtual WhatsApp Device simulator state
  const [showSimulator, setShowSimulator] = useState(true);
  const [simulatedGuestPhone, setSimulatedGuestPhone] = useState("+15550192834");
  const [simulatedGuestText, setSimulatedGuestText] = useState("");
  const [simulatedPhoneMessages, setSimulatedPhoneMessages] = useState<Array<{ sender: "guest" | "me" | "ai", text: string, time: string }>>([]);

  // Contact profile editing states
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [editLeadStage, setEditLeadStage] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Chat settings editing states
  const [editPersonaId, setEditPersonaId] = useState("");
  const [editCustomPrompt, setEditCustomPrompt] = useState("");
  const [editMemorySummary, setEditMemorySummary] = useState("");
  const [editAiStatus, setEditAiStatus] = useState<"AI" | "Manual" | "Paused">("AI");
  const [editLanguage, setEditLanguage] = useState("English");

  // Save states
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const simEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollSimToBottom = () => {
    simEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    scrollSimToBottom();
  }, [simulatedPhoneMessages]);

  // Fetch conversations, contacts, and personas
  const fetchConversations = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/messages", { headers });
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchContacts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/contacts", { headers });
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  };

  const fetchPersonas = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/personas", { headers });
      const data = await res.json();
      setPersonas(data);
    } catch (err) {
      console.error("Error fetching personas:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    fetchPersonas();
  }, [token]);

  // Connect WebSockets for real-time instant updates
  useEffect(() => {
    const socketUrl = window.location.origin;
    const s = io(socketUrl);

    s.on("connect", () => {
      s.emit("authenticate", token);
    });

    s.on("authenticated", (status) => {
      if (status.success) {
        setSocket(s);
      }
    });

    s.on("message_added", (data: { conversationId: string; message: Message }) => {
      // If we are looking at this conversation, push to messages
      setSelectedConv((curr) => {
        if (curr && curr.id === data.conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
        return curr;
      });
      fetchConversations();
    });

    s.on("conversations_updated", (updatedList: Conversation[]) => {
      setConversations(updatedList);
      // Update selected conversation instance to reflect status
      setSelectedConv((curr) => {
        if (curr) {
          const found = updatedList.find(c => c.id === curr.id);
          return found || curr;
        }
        return null;
      });
    });

    s.on("typing_status", (data: { conversationId: string; status: "typing" | "idle" }) => {
      setSelectedConv((curr) => {
        if (curr && curr.id === data.conversationId) {
          setIsTyping(data.status === "typing");
        }
        return curr;
      });
    });

    // Simulated device updates
    s.on("simulated_receive_reply", (data: { phone: string; text: string; sender: "user" | "ai" }) => {
      setSimulatedGuestPhone((currPhone) => {
        if (currPhone === data.phone) {
          setSimulatedPhoneMessages((prev) => [
            ...prev,
            {
              sender: data.sender === "ai" ? "ai" : "me",
              text: data.text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          ]);
        }
        return currPhone;
      });
    });

    return () => {
      s.disconnect();
    };
  }, [token]);

  // Load chat history when conversation selected
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setIsTyping(false);

    // Sync input states for editing
    setEditContactName(conv.contactName || "");
    setEditContactPhone(conv.contactPhone || "");
    setEditPriority(conv.priority || "Medium");
    setEditLeadStage(conv.leadStage || "New Lead");
    setEditTags(conv.tags ? conv.tags.join(", ") : "");
    setEditNotes(conv.notes || "");

    setEditPersonaId(conv.personaId || "");
    setEditCustomPrompt(conv.customPrompt || "");
    setEditMemorySummary(conv.memorySummary || "");
    setEditAiStatus(conv.aiStatus || "AI");
    setEditLanguage(conv.language || "English");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/messages/${conv.id}`, { headers });
      const data = await res.json();
      setMessages(data.messages);
      
      // Seed simulator chat history matching this contact
      setSimulatedGuestPhone(conv.contactPhone);
      const mappedSimMsgs = data.messages.map((m: Message) => ({
        sender: m.sender === "contact" ? "guest" as const : (m.sender === "ai" ? "ai" as const : "me" as const),
        text: m.text,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
      setSimulatedPhoneMessages(mappedSimMsgs);

      // Refresh list to clear unread indicator
      fetchConversations();
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  // Manual message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedConv) return;

    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers,
        body: JSON.stringify({
          conversationId: selectedConv.id,
          text: typedMessage
        }),
      });

      if (res.ok) {
        setTypedMessage("");
        // Load messages
        const data = await res.json();
        setMessages((prev) => [...prev, data]);
        fetchConversations();
      }
    } catch (err) {
      console.error("Error manual reply sending:", err);
    }
  };

  // Takeover status toggler
  const handleToggleTakeover = async (mode: "AI" | "Manual" | "Paused") => {
    if (!selectedConv) return;
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      const res = await fetch(`/api/messages/${selectedConv.id}/mode`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ aiStatus: mode }),
      });

      if (res.ok) {
        const updatedConv = await res.json();
        setSelectedConv(updatedConv);
        // Also sync AI status editing state
        setEditAiStatus(updatedConv.aiStatus);
        fetchConversations();
      }
    } catch (err) {
      console.error("Error changing conversation mode:", err);
    }
  };

  // Save Contact Profile
  const handleSaveContactProfile = async () => {
    if (!selectedConv) return;
    setProfileSaving(true);
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const tagsArray = editTags.split(",").map(t => t.trim()).filter(Boolean);

      // 1. If we have a contactId, patch the contact record
      if (selectedConv.contactId) {
        await fetch(`/api/contacts/${selectedConv.contactId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            name: editContactName,
            phone: editContactPhone,
            notes: editNotes,
            tags: tagsArray
          })
        });
      }

      // 2. Patch the conversation settings
      const res = await fetch(`/api/conversations/${selectedConv.id}/settings`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          contactName: editContactName,
          contactPhone: editContactPhone,
          priority: editPriority,
          leadStage: editLeadStage,
          tags: tagsArray,
          notes: editNotes
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedConv(updated);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2000);
        fetchConversations();
        fetchContacts();
      }
    } catch (err) {
      console.error("Error saving contact profile:", err);
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Chat-Level AI settings
  const handleSaveChatSettings = async () => {
    if (!selectedConv) return;
    setSettingsSaving(true);
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`/api/conversations/${selectedConv.id}/settings`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          personaId: editPersonaId || null,
          customPrompt: editCustomPrompt,
          memorySummary: editMemorySummary,
          aiStatus: editAiStatus,
          language: editLanguage
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedConv(updated);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
        fetchConversations();
      }
    } catch (err) {
      console.error("Error saving conversation settings:", err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Simulating sending from Virtual Device
  const handleSendSimulatedGuestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedGuestText.trim()) return;

    // Instantly append locally to virtual guest UI
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSimulatedPhoneMessages((prev) => [
      ...prev,
      { sender: "guest", text: simulatedGuestText, time: timeStr }
    ]);

    const msgToSend = simulatedGuestText;
    setSimulatedGuestText("");

    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      const res = await fetch("/api/whatsapp/simulate-incoming", {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone: simulatedGuestPhone,
          text: msgToSend
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Simulation Error: ${data.error || "Ensure simulated WhatsApp is Connected under Settings first!"}`);
      } else {
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to post simulation incoming", err);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 font-sans text-zinc-100">
      {/* 1. Conversations List (Left) */}
      <div className="w-full lg:w-80 bg-[#111111] rounded-2xl border border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-zinc-100 text-base">Active Chats</h2>
            <p className="text-zinc-400 text-[10px] mt-0.5">Toggle and configure per-chat AI</p>
          </div>
          <button
            onClick={() => setShowBulkModal(!showBulkModal)}
            className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-lg font-bold hover:bg-indigo-500/20 transition-all cursor-pointer flex items-center gap-1"
          >
            <Tag className="w-2.5 h-2.5" />
            Bulk Persona
          </button>
        </div>

        {showBulkModal && (
          <div className="m-2 p-3 bg-[#151515] border border-white/5 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-400">Bulk Assign Persona</span>
              <button 
                onClick={() => setShowBulkModal(false)} 
                className="text-zinc-500 hover:text-zinc-300 font-extrabold text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bulkSuccess ? (
              <div className="text-emerald-400 font-bold text-center py-2">
                ✓ Assigned successfully!
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Contact Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. lead, vip"
                    value={bulkTag}
                    onChange={(e) => setBulkTag(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Select Persona to Assign</label>
                  <select
                    value={bulkPersonaId}
                    onChange={(e) => setBulkPersonaId(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">-- Select Persona --</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={async () => {
                    if (!bulkPersonaId || !bulkTag) return;
                    try {
                      const headers = { 
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                      };
                      const res = await fetch("/api/conversations/bulk-persona", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                          personaId: bulkPersonaId,
                          tags: [bulkTag]
                        })
                      });

                      if (res.ok) {
                        setBulkSuccess(true);
                        setTimeout(() => {
                          setBulkSuccess(false);
                          setShowBulkModal(false);
                          setBulkTag("");
                        }, 2000);
                        fetchConversations();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  disabled={!bulkPersonaId || !bulkTag}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-1.5 rounded-lg transition-all cursor-pointer text-center"
                >
                  Apply Bulk Assignment
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const resolvedPersona = personas.find(p => p.id === conv.personaId);
              const personaName = resolvedPersona ? resolvedPersona.name : "Friendly Support";
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 border ${
                    isSelected 
                      ? "bg-white/5 border-emerald-500/30 text-white" 
                      : "bg-transparent border-transparent hover:bg-white/[0.02] text-zinc-300"
                  }`}
                >
                  <div className="w-10 h-10 bg-[#1a1a1a] text-zinc-300 rounded-full flex items-center justify-center font-bold shrink-0 border border-white/5 relative">
                    {conv.contactName.slice(0, 2).toUpperCase()}
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-black font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#111111]">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm truncate">{conv.contactName}</h4>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(conv.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-emerald-400" : "text-zinc-400"}`}>
                      {conv.lastMessage}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 items-center mt-2.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                        {personaName}
                      </span>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                        conv.aiStatus === "AI" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : conv.aiStatus === "Paused"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                      }`}>
                        {conv.aiStatus === "AI" ? "AI Agent" : conv.aiStatus === "Paused" ? "Paused" : "Human"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Primary Chat Interface (Center) */}
      <div className="flex-1 bg-[#111111] rounded-2xl border border-white/5 flex flex-col min-w-0">
        {selectedConv ? (
          <>
            {/* Header / Human Takeover Controls */}
            <div className="p-4 border-b border-white/5 bg-[#161616]/50 rounded-t-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm">
                  {selectedConv.contactName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm">{selectedConv.contactName}</h3>
                  <p className="text-zinc-400 text-xs">{selectedConv.contactPhone}</p>
                </div>
              </div>

              {/* Human Takeover Actions */}
              <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/5 shrink-0">
                <button
                  onClick={() => handleToggleTakeover("AI")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                    selectedConv.aiStatus === "AI"
                      ? "bg-emerald-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI Agent
                </button>
                <button
                  onClick={() => handleToggleTakeover("Manual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                    selectedConv.aiStatus === "Manual"
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Takeover
                </button>
                <button
                  onClick={() => handleToggleTakeover("Paused")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                    selectedConv.aiStatus === "Paused"
                      ? "bg-amber-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              </div>
            </div>

            {/* Messages Canvas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141414]">
              {messages.map((m) => {
                const isContact = m.sender === "contact";
                const isAi = m.sender === "ai";
                return (
                  <div key={m.id} className={`flex ${isContact ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                      isContact
                        ? "bg-[#1c1c1c] text-zinc-100 rounded-tl-none border border-white/5"
                        : isAi
                        ? "bg-emerald-600/95 text-white rounded-tr-none border border-emerald-500/20"
                        : "bg-indigo-600/95 text-white rounded-tr-none border border-indigo-500/20"
                    }`}>
                      {/* Identity Badge */}
                      {!isContact && (
                        <span className={`text-[9px] font-extrabold uppercase block mb-1 tracking-wider opacity-90 flex items-center gap-1 ${
                          isAi ? "text-emerald-200" : "text-indigo-200"
                        }`}>
                          {isAi ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {isAi ? "AI Agent Response" : "Human Manual Reply"}
                        </span>
                      )}
                      
                      <p className="text-sm whitespace-pre-line leading-relaxed">{m.text}</p>
                      
                      <span className={`text-[9px] block mt-1.5 text-right opacity-70 ${
                        isContact ? "text-zinc-500" : "text-white/80"
                      }`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1c1c1c] rounded-2xl px-4 py-3 rounded-tl-none border border-white/5 flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      AI Agent is thinking...
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-3 bg-[#111111] rounded-b-2xl">
              <input
                type="text"
                placeholder={
                  selectedConv.aiStatus === "AI" 
                    ? "AI Mode is Active. To reply manually, select 'Takeover' above." 
                    : "Type a manual response here..."
                }
                value={typedMessage}
                disabled={selectedConv.aiStatus === "AI"}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm disabled:opacity-55"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim() || selectedConv.aiStatus === "AI"}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white rounded-xl px-5 flex items-center justify-center transition-all focus:outline-none cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#141414] rounded-2xl">
            <div className="w-12 h-12 bg-[#1c1c1c] text-zinc-400 rounded-lg flex items-center justify-center mb-4 border border-white/5">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-200 text-base">No chat selected</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm leading-relaxed">
              Select an active conversation from the sidebar to view chat history and configure AI takeover modes.
            </p>
          </div>
        )}
      </div>

      {/* 3. Right Multi-Tab Column (Simulator vs Contact Profile vs AI Settings) */}
      <div className="w-full lg:w-96 bg-[#111111] text-white rounded-3xl p-4 flex flex-col shrink-0 shadow-2xl relative border border-white/5 overflow-hidden">
        {/* Notch decoration */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#1a1a1a] rounded-full z-10 hidden lg:block"></div>
        
        {/* Device Status/Header line */}
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-3 px-2 mt-1 shrink-0">
          <span>9:41 AM</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Simulated WhatsApp</span>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border border-white/5 mb-4 p-1 bg-black/40 rounded-xl shrink-0">
          <button
            onClick={() => setRightTab("simulator")}
            className={`flex-1 py-1.5 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              rightTab === "simulator"
                ? "bg-white/5 text-emerald-400 border border-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Simulator
          </button>
          <button
            onClick={() => setRightTab("profile")}
            className={`flex-1 py-1.5 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              rightTab === "profile"
                ? "bg-white/5 text-indigo-400 border border-indigo-500/10"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            CRM Card
          </button>
          <button
            onClick={() => setRightTab("settings")}
            className={`flex-1 py-1.5 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
              rightTab === "settings"
                ? "bg-white/5 text-amber-400 border border-amber-500/10"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Rules
          </button>
        </div>

        {/* Tab Content Canvas */}
        {rightTab === "simulator" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Guest Device Chat Header */}
            <div className="bg-[#1c1c1c] rounded-2xl p-3 mb-3 flex items-center justify-between border border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight text-zinc-200">Caller Phone Simulator</h4>
                  <p className="text-[9px] text-zinc-500 truncate max-w-[130px]">{simulatedGuestPhone}</p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                GUEST
              </span>
            </div>

            {/* Simulated Guest Config / Phone input */}
            <div className="bg-black/25 border border-white/5 rounded-xl p-2.5 mb-3 shrink-0 space-y-1.5">
              <label className="block text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Test custom phone numbers:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={simulatedGuestPhone}
                  onChange={(e) => setSimulatedGuestPhone(e.target.value)}
                  className="flex-1 bg-[#161616] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedPhoneMessages([]);
                    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
                    setSimulatedGuestPhone(`+1555${randomSuffix}`);
                  }}
                  className="bg-[#202020] hover:bg-zinc-800 border border-white/5 px-2.5 rounded-lg text-[10px] text-zinc-300 font-semibold cursor-pointer transition-all"
                >
                  Randomize
                </button>
              </div>
            </div>

            {/* Guest Simulator Screen messages */}
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a] rounded-2xl p-3 space-y-3 mb-3 flex flex-col border border-white/5 min-h-0">
              {simulatedPhoneMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-zinc-600 my-auto">
                  <Smartphone className="w-8 h-8 mb-2 opacity-40 text-zinc-400" />
                  <p className="text-[10px] leading-relaxed">Guest chat history. Send messages from this phone simulator to test Gemini AI agent replies!</p>
                </div>
              ) : (
                simulatedPhoneMessages.map((msg, idx) => {
                  const isGuest = msg.sender === "guest";
                  return (
                    <div key={idx} className={`flex ${isGuest ? "justify-end" : "justify-start"}`}>
                      <div className={`rounded-xl px-3 py-1.5 max-w-[85%] text-xs ${
                        isGuest 
                          ? "bg-emerald-600/90 text-white border border-emerald-500/20 rounded-tr-none" 
                          : "bg-[#1c1c1c] text-zinc-200 rounded-tl-none border border-white/5"
                      }`}>
                        <span className="text-[8px] font-extrabold opacity-60 block tracking-wider uppercase mb-0.5">
                          {isGuest ? "You (Guest Phone)" : (msg.sender === "ai" ? "Business AI Agent" : "Business Owner")}
                        </span>
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        <span className="text-[8px] block text-right mt-1 opacity-60">{msg.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={simEndRef} />
            </div>

            {/* Send message as Guest Device form */}
            <form onSubmit={handleSendSimulatedGuestMessage} className="space-y-2 shrink-0">
              {/* Preset templates selector to make testing quick */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSimulatedGuestText("Hello, how can I schedule a consultation?")}
                  className="bg-[#1c1c1c] hover:bg-[#252525] active:bg-zinc-800 text-[10px] px-2.5 py-1 rounded-lg shrink-0 transition-all border border-white/5 text-zinc-300 cursor-pointer font-medium"
                >
                  Consultation?
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedGuestText("What are your business hours?")}
                  className="bg-[#1c1c1c] hover:bg-[#252525] active:bg-zinc-800 text-[10px] px-2.5 py-1 rounded-lg shrink-0 transition-all border border-white/5 text-zinc-300 cursor-pointer font-medium"
                >
                  Hours?
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedGuestText("Can I get premium team license pricing?")}
                  className="bg-[#1c1c1c] hover:bg-[#252525] active:bg-zinc-800 text-[10px] px-2.5 py-1 rounded-lg shrink-0 transition-all border border-white/5 text-zinc-300 cursor-pointer font-medium"
                >
                  Pricing?
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Send simulated WhatsApp..."
                  value={simulatedGuestText}
                  onChange={(e) => setSimulatedGuestText(e.target.value)}
                  className="flex-1 bg-[#1c1c1c] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!simulatedGuestText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 text-black font-semibold rounded-xl px-3 flex items-center justify-center transition-all focus:outline-none cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-zinc-600 text-center block mt-1 leading-tight">
                Simulates real-time incoming messages on connected WhatsApp API
              </span>
            </form>
          </div>
        )}

        {rightTab === "profile" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {!selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <User className="w-10 h-10 mb-2 opacity-35 text-zinc-400" />
                <p className="text-xs leading-relaxed">Select a conversation from the list to view and update Contact Card.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-xs text-zinc-200">Contact CRM Card</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">WhatsApp Phone</label>
                    <input
                      type="text"
                      value={editContactPhone}
                      disabled
                      className="w-full bg-[#161616]/50 border border-white/5 rounded-xl py-2 px-3 text-zinc-500 select-none cursor-not-allowed font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Lead Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Lead Stage</label>
                      <input
                        type="text"
                        value={editLeadStage}
                        onChange={(e) => setEditLeadStage(e.target.value)}
                        placeholder="e.g. New Lead"
                        className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Tags (Comma Separated)</span>
                      <Tag className="w-3 h-3 text-zinc-500" />
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Lead, Interested, Billing"
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Internal CRM Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={5}
                      placeholder="Enter customer details, notes, or business insights..."
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSaveContactProfile}
                    disabled={profileSaving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer mt-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {profileSaving ? "Saving..." : profileSaved ? "Profile Saved!" : "Save CRM Profile"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {rightTab === "settings" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {!selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Bot className="w-10 h-10 mb-2 opacity-35 text-zinc-400" />
                <p className="text-xs leading-relaxed">Select a conversation from the list to view and configure Chat AI Rules.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Bot className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs text-zinc-200">Chat AI Rules & Context</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Persona Selection */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Assigned AI Persona</label>
                    <select
                      value={editPersonaId}
                      onChange={(e) => setEditPersonaId(e.target.value)}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">Global Default Persona</option>
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">
                      Assigns specific behavior guidelines and custom tone rules to this customer chat.
                    </span>
                  </div>

                  {/* AI Status Override */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">AI Takeover Status</label>
                    <select
                      value={editAiStatus}
                      onChange={(e) => setEditAiStatus(e.target.value as any)}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="AI">AI Agent (Autonomous Responses)</option>
                      <option value="Manual">Takeover (AI replies muted)</option>
                      <option value="Paused">Paused (Read-only monitoring)</option>
                    </select>
                  </div>

                  {/* Contact Custom Prompt */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Customer Custom Prompt Override</label>
                    <textarea
                      value={editCustomPrompt}
                      onChange={(e) => setEditCustomPrompt(e.target.value)}
                      rows={3}
                      placeholder="e.g. Treat as high priority. Offer custom wholesale plans only."
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                    ></textarea>
                    <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">
                      Instructions injected specifically to Gemini AI contexts for this contact.
                    </span>
                  </div>

                  {/* Memory Summary */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Persistent Chat Memory Summary</label>
                    <textarea
                      value={editMemorySummary}
                      onChange={(e) => setEditMemorySummary(e.target.value)}
                      rows={3}
                      placeholder="Summary of previous client issues, updates, or details..."
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                    ></textarea>
                    <span className="text-[9px] text-zinc-500 block mt-1 leading-tight">
                      Maintains long-term memory summary injected into future Gemini prompts.
                    </span>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Language override</label>
                    <input
                      type="text"
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      placeholder="English"
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveChatSettings}
                    disabled={settingsSaving}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer mt-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {settingsSaving ? "Saving..." : settingsSaved ? "Settings Saved!" : "Save AI Rules"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

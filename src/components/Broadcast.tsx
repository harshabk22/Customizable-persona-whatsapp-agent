import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Send, Megaphone, CheckSquare, Square, Search, 
  MessageSquare, Users, AlertCircle, Clock, CheckCircle2 
} from "lucide-react";
import { Contact, Broadcast } from "../types";

interface BroadcastProps {
  token: string;
}

export default function BroadcastPanel({ token }: BroadcastProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/contacts", { headers });
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/broadcast/history", { headers });
      const data = await res.json();
      setBroadcasts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchHistory();
  }, [token]);

  // Connect WebSockets to receive live updates of broadcast campaign sending
  useEffect(() => {
    const socketUrl = window.location.origin;
    const socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("authenticate", token);
    });

    socket.on("broadcast_updated", (updatedCampaign: Broadcast) => {
      setBroadcasts((curr) => {
        const index = curr.findIndex((b) => b.id === updatedCampaign.id);
        if (index === -1) {
          return [updatedCampaign, ...curr];
        }
        const next = [...curr];
        next[index] = updatedCampaign;
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleSelectContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredContacts.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selectedContacts.includes(id));

    if (allSelected) {
      setSelectedContacts((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedContacts((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Please specify a campaign name");
    if (!messageText.trim()) return setError("Please input message content");
    if (selectedContacts.length === 0) return setError("Please select at least one contact");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          messageText,
          contactIds: selectedContacts,
          scheduledTime: scheduledTime || undefined,
        }),
      });

      if (res.ok) {
        setName("");
        setMessageText("");
        setSelectedContacts([]);
        setScheduledTime("");
        fetchHistory();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create campaign");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto font-sans text-zinc-100">
      {/* Compose Section (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">New Announcement</h2>
              <p className="text-zinc-400 text-xs mt-0.5">Blast custom messages to selected customer categories.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 rounded-r-lg text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Campaign Name</label>
                <input
                  type="text"
                  placeholder="E.g., Q3 Discount Announcement"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Schedule Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Message Body</label>
              <textarea
                rows={5}
                placeholder="E.g., Hello, we are launching our new products! Visit our website to learn more..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm"
              />
              <span className="text-[10px] text-zinc-500 block mt-1.5 leading-relaxed">
                Tip: Standard WhatsApp text length limit is 1000 characters. Emojis and basic spacing are fully supported.
              </span>
            </div>

            {/* Merge Tags / Simple Preview */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs">
              <span className="font-bold text-zinc-400 block mb-1.5 uppercase text-[9px] tracking-wider">Preview Panel</span>
              <p className="text-zinc-300 leading-relaxed italic">
                {messageText ? messageText : "Begin writing your campaign body above to preview output structure."}
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none text-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {scheduledTime ? "Schedule Announcement" : `Send Instant Broadcast to ${selectedContacts.length} Contacts`}
            </button>
          </form>
        </div>

        {/* Campaign History */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold text-zinc-100 text-sm mb-4">Historical Campaigns</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {broadcasts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No past campaigns compiled.
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-100">{b.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      b.status === "Sent"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : b.status === "Sending"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        : "bg-white/5 text-zinc-400 border border-white/5"
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-[11px] line-clamp-2 leading-relaxed">{b.messageText}</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Progress: {b.progress}%</span>
                      <span>{b.sentCount} of {b.contactsCount} delivered</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          b.status === "Sent" ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${b.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Target Audience selection (Right Column) */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h3 className="font-bold text-zinc-100 text-sm">Target Audience</h3>
            <p className="text-zinc-500 text-[11px] mt-0.5">{selectedContacts.length} of {contacts.length} selected</p>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold focus:outline-none cursor-pointer"
          >
            Toggle All
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter target group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all text-xs mb-4 shrink-0"
        />

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[500px]">
          {loading ? (
            <div className="text-center py-10">
              <span className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block"></span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No contacts match search filter.
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContacts.includes(contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      : "bg-transparent border-transparent hover:bg-white/[0.02] text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button type="button" className="text-zinc-500 hover:text-indigo-400 shrink-0 focus:outline-none cursor-pointer">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-700" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs truncate leading-tight text-zinc-200">{contact.name}</h4>
                      <p className="text-[10px] text-zinc-500 leading-none mt-0.5">{contact.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {contact.tags.slice(0, 1).map((tag, i) => (
                      <span key={i} className="text-[9px] bg-white/5 text-zinc-400 border border-white/5 px-1.5 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { 
  MessageSquare, Users, Cpu, Shield, RefreshCw, Smartphone, 
  Clock, Zap, CheckCircle2, TrendingUp, AlertCircle 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend 
} from "recharts";
import { Contact, Conversation, WhatsAppSession, Log, Analytics } from "../types";

interface DashboardProps {
  token: string;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ token, onNavigate }: DashboardProps) {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [contactsCount, setContactsCount] = useState(0);
  const [convsCount, setConvsCount] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);
  const [aiRepliesToday, setAiRepliesToday] = useState(0);
  const [recentConvs, setRecentConvs] = useState<Conversation[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [analyticsData, setAnalyticsData] = useState<Analytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // WhatsApp Status
        const statusRes = await fetch("/api/whatsapp/status", { headers });
        const statusData = await statusRes.json();
        setSession(statusData);

        // Contacts Count
        const contactsRes = await fetch("/api/contacts", { headers });
        const contactsData = await contactsRes.json();
        setContactsCount(contactsData.length);

        // Conversations / Messages
        const convsRes = await fetch("/api/messages", { headers });
        const convsData = (await convsRes.json()) as Conversation[];
        setConvsCount(convsData.length);
        setRecentConvs(convsData.slice(0, 5));

        // Fetch logs
        const logsRes = await fetch("/api/logs", { headers });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.slice(0, 15));
        }

        // Fetch analytics
        const analyticsRes = await fetch("/api/analytics", { headers });
        if (analyticsRes.ok) {
          const analyticsData = (await analyticsRes.json()) as Analytics[];
          const sortedAnalytics = analyticsData
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(item => {
              const dateObj = new Date(item.date + "T00:00:00");
              const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short" });
              return {
                ...item,
                displayDate: dayLabel
              };
            });
          setAnalyticsData(sortedAnalytics);

          if (sortedAnalytics.length > 0) {
            const todayMetrics = sortedAnalytics[sortedAnalytics.length - 1];
            setMessagesToday(todayMetrics.totalMessages);
            setAiRepliesToday(todayMetrics.aiReplies);
          }
        }

      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token]);

  // Connect WebSockets for real-time dashboard updates
  useEffect(() => {
    if (!token) return;

    const socketUrl = window.location.origin;
    const socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("authenticate", token);
    });

    socket.on("log_added", (newLog: Log) => {
      setLogs((prev) => [newLog, ...prev].slice(0, 15));
    });

    socket.on("analytics_updated", (record: Analytics) => {
      setAnalyticsData((prev) => {
        const dateObj = new Date(record.date + "T00:00:00");
        const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const formattedRecord = {
          ...record,
          displayDate: dayLabel
        };

        const index = prev.findIndex((item) => item.date === record.date);
        if (index === -1) {
          return [...prev, formattedRecord].slice(-7);
        }
        const next = [...prev];
        next[index] = formattedRecord;

        if (index === prev.length - 1) {
          setMessagesToday(record.totalMessages);
          setAiRepliesToday(record.aiReplies);
        }
        return next;
      });
    });

    socket.on("whatsapp_status", (status: WhatsAppSession) => {
      setSession(status);
    });

    socket.on("conversations_updated", (updatedList: Conversation[]) => {
      setConvsCount(updatedList.length);
      setRecentConvs(updatedList.slice(0, 5));
    });

    socket.on("contact_added", () => {
      const fetchContactsCount = async () => {
        try {
          const res = await fetch("/api/contacts", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setContactsCount(data.length);
        } catch (err) {
          console.error(err);
        }
      };
      fetchContactsCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Determine Connection Color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Connected":
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Connected
          </span>
        );
      case "Connecting":
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            Connecting...
          </span>
        );
      case "Disconnected":
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
            Disconnected
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 text-zinc-400 border border-white/5 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-zinc-600 rounded-full"></span>
            Not Connected
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-zinc-100">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Workspace Overview</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time status of your connected WhatsApp accounts and active AI agents.</p>
        </div>
        <div className="flex items-center gap-3">
          {session && getStatusBadge(session.status)}
          {session?.status !== "Connected" && (
            <button
              onClick={() => onNavigate("settings")}
              className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Configure WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Device</p>
            <h3 className="text-sm font-bold text-zinc-200 mt-1 truncate max-w-[120px]">
              {session?.phone ? session.phone : "No Device"}
            </h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contacts</p>
            <h3 className="text-xl font-bold text-zinc-200 mt-1">{contactsCount}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active chats</p>
            <h3 className="text-xl font-bold text-zinc-200 mt-1">{convsCount}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Messages Today</p>
            <h3 className="text-xl font-bold text-zinc-200 mt-1">{messagesToday}</h3>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Replies</p>
            <h3 className="text-xl font-bold text-zinc-200 mt-1">{aiRepliesToday}</h3>
          </div>
        </div>
      </div>

      {/* Analytics & Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Messages Chart */}
        <div className="lg:col-span-2 bg-[#111111] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Response volume</h2>
              <p className="text-zinc-400 text-xs mt-0.5">Performance comparing auto-replies against human takeover.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-zinc-400 font-medium">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                AI Agent
              </span>
              <span className="flex items-center gap-1 text-zinc-400 font-medium">
                <span className="w-2.5 h-2.5 bg-[#6366f1] rounded-full"></span>
                Human Support
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="humanColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="displayDate" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f4f5" }} />
                <Area type="monotone" dataKey="aiReplies" name="AI Replies" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#aiColor)" />
                <Area type="monotone" dataKey="humanReplies" name="Human Takeover" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#humanColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Average AI Response Speeds */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Response Speed</h2>
            <p className="text-zinc-400 text-xs mt-0.5">Average reply lag (seconds) recorded daily.</p>
          </div>
          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="displayDate" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f4f5" }} />
                <Bar dataKey="avgResponseTime" name="Response Lag" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity and System Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Conversations */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100">Recent Chats</h2>
              <p className="text-zinc-400 text-xs mt-0.5">Monitor current WhatsApp traffic</p>
            </div>
            <button
              onClick={() => onNavigate("conversations")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentConvs.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No active conversations recorded yet.
              </div>
            ) : (
              recentConvs.map((conv) => (
                <div 
                  key={conv.id} 
                  onClick={() => onNavigate("conversations")}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a1a] text-zinc-300 rounded-full flex items-center justify-center font-bold border border-white/5">
                      {conv.contactName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{conv.contactName}</h4>
                      <p className="text-zinc-400 text-xs truncate max-w-[180px] mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-zinc-500">
                      {new Date(conv.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      conv.aiStatus === "AI" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : conv.aiStatus === "Paused" 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}>
                      {conv.aiStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Workspace Logs */}
        <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-bold text-zinc-100">System Logs</h2>
            <p className="text-zinc-400 text-xs mt-0.5">Diagnostic actions and API interactions</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[290px] pr-1">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-xl bg-[#1a1a1a] border border-white/5 text-xs"
              >
                {log.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                {log.type === "info" && <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
                {log.type === "warning" && <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                {log.type === "error" && <Zap className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                
                <div className="flex-1">
                  <p className="text-zinc-300 leading-relaxed">{log.message}</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()} - {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

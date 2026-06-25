import React, { useEffect, useState } from "react";
import { 
  MessageSquare, LayoutDashboard, Users, Bot, Megaphone, 
  Settings as SettingsIcon, LogOut, Sparkles, Smartphone, Menu, X, User 
} from "lucide-react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Conversations from "./components/Conversations";
import Contacts from "./components/Contacts";
import Personas from "./components/Personas";
import BroadcastPanel from "./components/Broadcast";
import SettingsPanel from "./components/Settings";
import { Persona, WhatsAppSession } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<{ id: string; username: string; name: string } | null>(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null
  );

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [connection, setConnection] = useState<WhatsAppSession | null>(null);

  // Authenticate and retrieve details
  const handleAuthSuccess = (newToken: string, newUser: { id: string; username: string; name: string }) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // Poll active persona and connection status globally so the top bar is always correct in real-time
  useEffect(() => {
    if (!token) return;

    const fetchTopBarStatus = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Personas to find active one
        const pRes = await fetch("/api/personas", { headers });
        if (pRes.ok) {
          const pData = (await pRes.json()) as Persona[];
          const active = pData.find((p) => p.isActive);
          setActivePersona(active || pData[0] || null);
        }

        // 2. Fetch Session status
        const sRes = await fetch("/api/whatsapp/status", { headers });
        if (sRes.ok) {
          const sData = await sRes.json();
          setConnection(sData);
        }
      } catch (err) {
        console.error("Top bar poll error:", err);
      }
    };

    fetchTopBarStatus();
    const interval = setInterval(fetchTopBarStatus, 6000); // Poll every 6s
    return () => clearInterval(interval);
  }, [token, activeTab]);

  if (!token || !user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Sidebar Tabs Config
  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "conversations", label: "Conversations", icon: MessageSquare },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "personas", label: "Personas", icon: Bot },
    { id: "broadcast", label: "Broadcast", icon: Megaphone },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard token={token} onNavigate={setActiveTab} />;
      case "conversations":
        return <Conversations token={token} />;
      case "contacts":
        return <Contacts token={token} />;
      case "personas":
        return <Personas token={token} />;
      case "broadcast":
        return <BroadcastPanel token={token} />;
      case "settings":
        return <SettingsPanel token={token} />;
      default:
        return <Dashboard token={token} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans text-zinc-100">
      {/* 1. Sidebar Navigation (Left - Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111111] border-r border-white/5 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-extrabold shadow-lg shadow-emerald-500/20">
            W
          </div>
          <div>
            <h2 className="font-bold leading-none text-sm text-zinc-100">WA Agent</h2>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">AI Dashboard</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer focus:outline-none ${
                  isSelected
                    ? "bg-white/5 text-white border-l-2 border-emerald-500 rounded-l-none pl-2.5"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isSelected ? "text-emerald-400" : "text-zinc-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Subscription Plan details from Design HTML */}
        <div className="px-4 mb-2">
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
            <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Subscription</p>
            <p className="text-xs font-semibold text-zinc-200">Pro Business Plan</p>
            <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-white/5 bg-[#111111]">
          <div className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-xl border border-white/5 mb-3">
            <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs truncate leading-tight text-zinc-200">{user.name}</h4>
              <p className="text-[9px] text-zinc-500 truncate leading-none mt-1">{user.username}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all focus:outline-none"
          >
            <LogOut className="w-4.5 h-4.5" />
            Logout Workspace
          </button>
        </div>
      </aside>

      {/* 2. Main Area (Right) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Bar Navigation */}
        <header className="bg-[#0a0a0a] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
          {/* Mobile menu triggers */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-white/10 text-zinc-300 focus:outline-none hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-zinc-100 text-sm">WA AI Agent</span>
          </div>

          {/* Desktop status blocks */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
            {/* WhatsApp device status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141414] border border-white/5">
              <Smartphone className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-500 font-semibold">WhatsApp Status:</span>
              <span className={`font-extrabold flex items-center gap-1.5 ${
                connection?.status === "Connected" ? "text-emerald-400" : "text-zinc-500"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  connection?.status === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                }`}></span>
                {connection?.status || "Not Connected"}
              </span>
            </div>

            {/* Active AI Agent Persona status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-indigo-400 font-semibold">Active Persona:</span>
              <span className="font-extrabold text-indigo-200 uppercase text-[10px]">
                {activePersona ? activePersona.name : "Friendly Support"}
              </span>
            </div>
          </div>

          {/* User profile dropdown right */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="font-bold text-zinc-100 text-xs">{user.name}</span>
              <span className="text-[9px] text-zinc-500 font-semibold">Workspace Owner</span>
            </div>
            <div className="w-8 h-8 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center font-bold text-sm text-zinc-200">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0a0a0a]">
          {renderActiveTab()}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs">
          <div className="bg-[#111111] text-white w-64 flex flex-col p-6 space-y-6 relative h-full border-r border-white/5">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg border border-white/10 text-zinc-400 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pt-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-extrabold shadow-lg shadow-emerald-500/20">
                W
              </div>
              <h2 className="font-bold text-zinc-100 text-sm">WA Agent</h2>
            </div>

            <nav className="flex-1 space-y-1">
              {sidebarTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none ${
                      isSelected
                        ? "bg-white/5 text-white border-l-2 border-emerald-500 rounded-l-none pl-2.5"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/5 pt-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all focus:outline-none"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

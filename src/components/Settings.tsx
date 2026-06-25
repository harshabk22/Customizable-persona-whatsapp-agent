import React, { useEffect, useState } from "react";
import { 
  Save, Smartphone, RefreshCw, Key, Bot, Settings as SettingsIcon, 
  Download, Upload, CheckCircle2, AlertTriangle, Shield, Clock, HelpCircle, FileText 
} from "lucide-react";
import { Settings, WhatsAppSession, Persona } from "../types";

interface SettingsProps {
  token: string;
}

export default function SettingsPanel({ token }: SettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Simulated Device details to pair with
  const [simulatedPhone, setSimulatedPhone] = useState("+15551234567");
  const [simulatedName, setSimulatedName] = useState("AI Business Assistant (Simulated)");

  // Import / Backup file state
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/settings", { headers });
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionStatus = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/whatsapp/status", { headers });
      const data = await res.json();
      setSession(data);
      if (data.qrCode) {
        setQrToken(data.qrCode);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPersonas = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/personas", { headers });
      const data = await res.json();
      setPersonas(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchSettings(), fetchSessionStatus(), fetchPersonas()]);
      setLoading(false);
    };
    init();
  }, [token]);

  // Request new pairing QR Code
  const handleRequestQr = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/whatsapp/qr", { headers });
      const data = await res.json();
      setQrToken(data.qrCode);
      fetchSessionStatus();
    } catch (err) {
      console.error(err);
    }
  };

  // Simulated pair WhatsApp button
  const handleConnectWhatsApp = async () => {
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({
          simulatedPhone,
          simulatedName
        })
      });
      if (res.ok) {
        setQrToken("");
        fetchSessionStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Disconnect active session
  const handleDisconnectWhatsApp = async () => {
    if (!confirm("Are you sure you want to sever the WhatsApp session connection?")) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/whatsapp/disconnect", {
        method: "POST",
        headers,
      });
      if (res.ok) {
        setQrToken("");
        fetchSessionStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaveSuccess(false);
    setError("");

    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers,
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update configuration settings");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  // Trigger JSON Workspace Backup Download
  const handleExportBackup = () => {
    // Standard approach: open full browser download endpoint
    const url = `/api/backup/export?authorization=${encodeURIComponent("Bearer " + token)}`;
    
    // Create an anchor element to force download with auth header
    fetch("/api/backup/export", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `whatsapp-ai-agent-workspace-backup.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => {
      alert("Failed to compile workspace backup: " + err);
    });
  };

  // Handle workspace restore file upload
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError("");
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = event.target?.result as string;
        const backupData = JSON.parse(rawJson);

        const headers = { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        const res = await fetch("/api/backup/restore", {
          method: "POST",
          headers,
          body: JSON.stringify({ data: backupData })
        });

        if (res.ok) {
          setRestoreSuccess(true);
          fetchSettings();
          fetchSessionStatus();
          setTimeout(() => setRestoreSuccess(false), 3000);
        } else {
          const resData = await res.json();
          setRestoreError(resData.error || "Workspace restoration failed.");
        }
      } catch (err: any) {
        setRestoreError("Invalid workspace backup file format: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-10 text-zinc-100">
      {/* Settings Header */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Workspace Settings</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Manage WhatsApp device pairing, configure OpenAI & Gemini parameters, and perform backups.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: WhatsApp Pairing Control Panel */}
        <div className="space-y-6">
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <Smartphone className="w-5 h-5 text-zinc-400" />
              <h2 className="font-bold text-zinc-100 text-sm">WhatsApp Connection</h2>
            </div>

            {/* Current status display */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/40 text-center space-y-3">
              <span className="text-zinc-500 text-xs block font-semibold uppercase tracking-wider">Session Status</span>
              
              <div className="flex items-center justify-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  session?.status === "Connected" 
                    ? "bg-emerald-500 animate-pulse" 
                    : session?.status === "Connecting"
                    ? "bg-amber-500"
                    : "bg-zinc-600"
                }`}></span>
                <span className="font-extrabold text-sm text-zinc-200">
                  {session?.status ? session.status : "Not Connected"}
                </span>
              </div>

              {session?.phone && (
                <p className="text-xs text-zinc-400 mt-1">
                  Paired phone number: <span className="font-bold text-zinc-200">{session.phone}</span>
                </p>
              )}
            </div>

            {/* Simulated QR Pairing Canvas */}
            {session?.status === "Connecting" && qrToken && (
              <div className="flex flex-col items-center p-4 border border-white/5 rounded-xl bg-black/20 space-y-4">
                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                  {/* Highly polished Real-time Generated QR representation */}
                  <div className="w-48 h-48 bg-[#0a0a0a] rounded-lg flex flex-col items-center justify-center p-3 relative overflow-hidden border border-zinc-800">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=ffffff&bgcolor=0a0a0a&data=${encodeURIComponent(qrToken)}`}
                      alt="WhatsApp Pairing QR Code"
                      className="w-40 h-40 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <span className="inline-block text-[10px] font-extrabold tracking-wider bg-emerald-500 text-black px-2.5 py-0.5 rounded-full uppercase mb-1">
                    Pairing Ready
                  </span>
                  <p className="text-xs text-zinc-400 text-center max-w-[210px] leading-relaxed">
                    Scan this QR code with your WhatsApp app, or click below to simulate the connection instantly.
                  </p>
                </div>

                {/* Simulated Pairing Details Form */}
                <div className="w-full space-y-3.5 border-t border-white/5 pt-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={simulatedPhone}
                      onChange={(e) => setSimulatedPhone(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-lg py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Device Label</label>
                    <input
                      type="text"
                      value={simulatedName}
                      onChange={(e) => setSimulatedName(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-lg py-2 px-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>

                  <button
                    onClick={handleConnectWhatsApp}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    Simulate QR Scan & Connect
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {session?.status === "Connected" ? (
                <button
                  onClick={handleDisconnectWhatsApp}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 font-bold text-xs py-3 rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
                >
                  Disconnect WhatsApp Session
                </button>
              ) : (
                session?.status !== "Connecting" && (
                  <button
                    onClick={handleRequestQr}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Connect New Device (QR)
                  </button>
                )
              )}
            </div>
          </div>

          {/* Backup & Restore Operations */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <Download className="w-5 h-5 text-zinc-400" />
              <h2 className="font-bold text-zinc-100 text-sm">Backup & Restore</h2>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Persist all configured prompt blueprints, contacts list, and histories securely into a JSON file, or restore.
            </p>

            {restoreError && (
              <div className="p-3 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 rounded-r-lg text-xs leading-relaxed">
                {restoreError}
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400 rounded-r-lg text-xs leading-relaxed flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Backup restored successfully!</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full bg-[#1a1a1a] hover:bg-[#252525] active:bg-zinc-800 text-zinc-300 font-bold text-xs py-3 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Workspace Backup
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  className="w-full bg-[#1a1a1a] hover:bg-[#252525] active:bg-zinc-800 text-zinc-300 font-bold text-xs py-3 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Restore Backup from JSON File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI & Settings Configuration form (2 Cols equivalent) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveSettings} className="bg-[#111111] p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-5 h-5 text-zinc-400" />
                <h2 className="font-bold text-zinc-100 text-sm">AI Engine & Business Controls</h2>
              </div>

              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Settings saved!
                </span>
              )}
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 rounded-r-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* SECTION 1: Business profile */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Business Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Business Name</label>
                  <input
                    type="text"
                    required
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Default Response Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Indonesian">Indonesian</option>
                  </select>
                </div>
              </div>

              {/* Business Hours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Business Hours Start</label>
                  <input
                    type="time"
                    value={settings.businessHoursStart}
                    onChange={(e) => setSettings({ ...settings, businessHoursStart: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Business Hours End</label>
                  <input
                    type="time"
                    value={settings.businessHoursEnd}
                    onChange={(e) => setSettings({ ...settings, businessHoursEnd: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm"
                  />
                </div>

                {/* Auto Reply Global Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">AI Auto-Reply Engine</label>
                  <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 h-[44px]">
                    <input
                      type="checkbox"
                      id="autoReplyToggle"
                      checked={settings.autoReplyToggle}
                      onChange={(e) => setSettings({ ...settings, autoReplyToggle: e.target.checked })}
                      className="w-4.5 h-4.5 text-indigo-500 border-zinc-700 bg-zinc-800 rounded-xs focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="autoReplyToggle" className="text-xs font-medium text-zinc-300 cursor-pointer select-none">
                      Enable Auto-Replies
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: AI Prompt and Model Configurations */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                AI Agent Model Controls
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pre-Configured AI Model</label>
                  <select
                    value={settings.model}
                    disabled
                    className="w-full bg-[#151515] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-500 focus:outline-none text-sm font-semibold cursor-not-allowed"
                  >
                    <option value="gemini-2.5-flash">Gemini 3.5 Flash (Zero Setup Free)</option>
                  </select>
                  <span className="text-[10px] text-zinc-500 block mt-1.5 leading-relaxed">
                    Powered securely by Google AI Studio's server-side environment. No API keys required.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Global Default Persona</label>
                  <select
                    value={settings.defaultPersonaId || ""}
                    onChange={(e) => setSettings({ ...settings, defaultPersonaId: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm cursor-pointer font-medium"
                  >
                    <option value="">-- Active Persona Fallback --</option>
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-zinc-500 block mt-1.5 leading-relaxed">
                    Automatically assigned to any new incoming WhatsApp conversation.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">OpenAI Key (Fallback)</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-[#202020] transition-all text-sm font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 block mt-1.5 leading-relaxed">
                    Optional. Enter sk- key to use custom GPT endpoints instead of Gemini.
                  </span>
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Response Length</label>
                  <select
                    value={settings.responseLength}
                    onChange={(e) => setSettings({ ...settings, responseLength: e.target.value as any })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer"
                  >
                    <option value="Short">Short (1-2 sentences)</option>
                    <option value="Medium">Medium (1 paragraph)</option>
                    <option value="Detailed">Detailed (Structured list)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Message History</label>
                  <input
                    type="number"
                    value={settings.conversationMemory}
                    onChange={(e) => setSettings({ ...settings, conversationMemory: parseInt(e.target.value) })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Delays & Extra constraints */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Reply Delay (sec)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.replyDelay}
                    onChange={(e) => setSettings({ ...settings, replyDelay: parseInt(e.target.value) })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Typing Delay (sec)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.typingDelay}
                    onChange={(e) => setSettings({ ...settings, typingDelay: parseInt(e.target.value) })}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5 select-none">
                  <input
                    type="checkbox"
                    id="enableMarkdown"
                    checked={settings.enableMarkdown}
                    onChange={(e) => setSettings({ ...settings, enableMarkdown: e.target.checked })}
                    className="w-4 h-4 text-indigo-500 border-zinc-700 bg-zinc-800 rounded-xs focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="enableMarkdown" className="text-xs font-medium text-zinc-300 cursor-pointer">
                    WhatsApp Bold (*star*)
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-5 select-none">
                  <input
                    type="checkbox"
                    id="enableEmoji"
                    checked={settings.enableEmoji}
                    onChange={(e) => setSettings({ ...settings, enableEmoji: e.target.checked })}
                    className="w-4 h-4 text-indigo-500 border-zinc-700 bg-zinc-800 rounded-xs focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="enableEmoji" className="text-xs font-medium text-zinc-300 cursor-pointer">
                    Enable Agent Emojis
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Business Config
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Lock, User as UserIcon, MessageSquare, AlertCircle } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (token: string, user: { id: string; username: string; name: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { username, password } : { username, password, name };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans text-zinc-100">
      <div className="w-full max-w-md bg-[#111111] rounded-2xl border border-white/5 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-black mb-4 shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">WhatsApp AI Agent</h1>
          <p className="text-zinc-400 text-sm mt-1 text-center">
            {isLogin ? "Sign in to manage your AI personas" : "Create a workspace to start your AI automation"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 rounded-r-lg flex items-start gap-3 text-sm border-y border-r border-rose-500/20">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 text-zinc-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 text-zinc-500 w-5 h-5" />
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-zinc-500 w-5 h-5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-semibold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 focus:outline-none text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Workspace"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-all focus:outline-none cursor-pointer"
          >
            {isLogin ? "Need a workspace? Register here" : "Already have a workspace? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

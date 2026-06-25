import React, { useEffect, useState } from "react";
import { Plus, Bot, Sparkles, Edit2, Trash2, Copy, Play, CheckCircle2, X } from "lucide-react";
import { Persona } from "../types";

interface PersonasProps {
  token: string;
}

export default function Personas({ token }: PersonasProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("");
  const [error, setError] = useState("");

  const fetchPersonas = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/personas", { headers });
      const data = await res.json();
      setPersonas(data);
    } catch (err) {
      console.error("Failed to load personas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingPersona(null);
    setName("");
    setDescription("");
    setSystemPrompt("");
    setTone("Friendly");
    setError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Persona) => {
    setEditingPersona(p);
    setName(p.name);
    setDescription(p.description);
    setSystemPrompt(p.systemPrompt);
    setTone(p.tone);
    setError("");
    setShowModal(true);
  };

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      name,
      description,
      systemPrompt,
      tone,
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      if (editingPersona) {
        // Edit Mode
        const res = await fetch(`/api/personas/${editingPersona.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update persona");
        }
      } else {
        // Create Mode
        const res = await fetch("/api/personas", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create persona");
        }
      }

      setShowModal(false);
      fetchPersonas();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  const handleActivatePersona = async (id: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/personas/${id}/activate`, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        fetchPersonas();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to activate persona");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicatePersona = async (id: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/personas/${id}/duplicate`, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        fetchPersonas();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to duplicate persona");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePersona = async (p: Persona) => {
    if (p.isActive) {
      alert("You cannot delete an active persona. Please activate another persona first.");
      return;
    }

    if (!confirm(`Are you sure you want to delete the persona "${p.name}"?`)) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/personas/${p.id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        fetchPersonas();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete persona");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">AI Personas</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Build specialized AI personalities with customized system instructions and custom tones.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Persona
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((p) => (
            <div
              key={p.id}
              className={`bg-[#111111] rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                p.isActive 
                  ? "border-emerald-500 bg-[#141414]" 
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      p.isActive 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-[#1a1a1a] text-zinc-500 border-white/5"
                    }`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-200 text-sm leading-tight flex items-center gap-1.5">
                        {p.name}
                        {p.isActive && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-zinc-500 text-xs mt-0.5">Tone: {p.tone}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDuplicatePersona(p.id)}
                      title="Duplicate Persona"
                      className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      title="Edit Persona"
                      className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePersona(p)}
                      title="Delete Persona"
                      className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                  {p.description || "No description provided."}
                </p>

                <div className="bg-black/40 border border-white/5 p-3.5 rounded-xl text-xs text-zinc-400 leading-relaxed max-h-[110px] overflow-y-auto mb-6">
                  <span className="font-bold text-zinc-500 block mb-1 uppercase text-[9px] tracking-wider">System Prompt:</span>
                  {p.systemPrompt}
                </div>
              </div>

              {!p.isActive && (
                <button
                  onClick={() => handleActivatePersona(p.id)}
                  className="w-full bg-[#1a1a1a] hover:bg-emerald-500/10 text-zinc-300 hover:text-emerald-400 font-bold py-2.5 px-4 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all text-xs flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Activate Persona
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Persona */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-2xl border border-white/5 flex flex-col max-h-[90vh] shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-zinc-100 text-base">
                {editingPersona ? "Edit Persona" : "Create Persona"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePersona} className="p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 rounded-r-lg text-xs leading-relaxed">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Persona Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Friendly Support"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tone</label>
                  <input
                    type="text"
                    required
                    placeholder="Empathetic, helpful, friendly"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description</label>
                <input
                  type="text"
                  placeholder="E.g., Customer support representative for managing billing inquires."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">System Instructions / Prompt</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Instructions for the AI to follow. E.g., 'You are an empathetic support agent named Alice. Answer customer inquiries with detailed step-by-step guidance. Maintain a positive, professional tone...'"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm font-mono text-xs"
                />
              </div>

              <div className="pt-2 border-t border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#252525] active:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold py-2.5 rounded-xl transition-all focus:outline-none text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold py-2.5 rounded-xl transition-all focus:outline-none text-xs cursor-pointer"
                >
                  Save Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Plus, Search, Tag, User, Smartphone, Trash2, Edit2, X, Sparkles } from "lucide-react";
import { Contact, Persona } from "../types";

interface ContactsProps {
  token: string;
}

export default function Contacts({ token }: ContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [assignedPersonaId, setAssignedPersonaId] = useState("");
  const [error, setError] = useState("");

  const fetchContacts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/contacts", { headers });
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/personas", { headers });
      const data = await res.json();
      setPersonas(data);
    } catch (err) {
      console.error("Failed to load personas:", err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchPersonas();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setName("");
    setPhone("");
    setNotes("");
    setTagsText("");
    setAssignedPersonaId("");
    setError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setNotes(contact.notes);
    setTagsText(contact.tags.join(", "));
    setAssignedPersonaId(contact.assignedPersonaId || "");
    setError("");
    setShowModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      name,
      phone,
      tags,
      notes,
      assignedPersonaId: assignedPersonaId || undefined,
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      if (editingContact) {
        // Edit Mode
        const res = await fetch(`/api/contacts/${editingContact.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to edit contact");
        }
      } else {
        // Add Mode
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create contact");
        }
      }

      setShowModal(false);
      fetchContacts();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        fetchContacts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete contact");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-zinc-100">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Contacts Management</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Store customers, apply descriptive tags, and override active AI Persona assignment.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 text-zinc-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search contacts by name, phone, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all text-sm"
        />
      </div>

      {/* Contacts List Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-12 h-12 bg-[#1c1c1c] text-zinc-400 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/5">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-zinc-200 text-base">No contacts found</h3>
          <p className="text-zinc-500 text-xs mt-1">Try resetting your search parameter or create a new contact.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => {
            const assignedPersona = personas.find((p) => p.id === contact.assignedPersonaId);
            return (
              <div
                key={contact.id}
                className="bg-[#111111] rounded-2xl border border-white/5 p-5 transition-all flex flex-col justify-between hover:border-white/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#1a1a1a] text-zinc-300 border border-white/5 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-200 text-sm leading-tight">{contact.name}</h3>
                        <p className="text-zinc-400 text-xs flex items-center gap-1 mt-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          {contact.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEditModal(contact)}
                        className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {contact.notes && (
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl mb-4 text-xs text-zinc-300 leading-relaxed">
                      {contact.notes}
                    </div>
                  )}

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {contact.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-white/5 text-zinc-400 border border-white/5 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Persona block */}
                <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs mt-2">
                  <span className="text-zinc-500 text-[11px]">Assigned Persona:</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    {assignedPersona ? assignedPersona.name : "Default Active"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add/Edit Contact */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] w-full max-w-md rounded-2xl border border-white/5 flex flex-col max-h-[90vh] shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-zinc-100 text-base">
                {editingContact ? "Edit Contact" : "Add Contact"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-white/5 p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveContact} className="p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-500/10 border-l-4 border-rose-500 text-rose-400 rounded-r-lg text-xs leading-relaxed">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alice Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+15551234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Lead, Interested, VIP"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Override Persona</label>
                <select
                  value={assignedPersonaId}
                  onChange={(e) => setAssignedPersonaId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm cursor-pointer"
                >
                  <option value="">Default Active Persona</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add notes about this customer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 px-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-[#202020] transition-all text-sm"
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

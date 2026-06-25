<div align="center">
<img width="1200" height="475" alt="WhatsApp AI Agent Dashboard" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Customizable Persona WhatsApp Agent Dashboard

A premium, full-stack WhatsApp AI Agent Dashboard powered by the **Google Gemini API** (`gemini-3.5-flash`). This application allows businesses to pair virtual WhatsApp devices, define multiple specialized AI personas (e.g., empathetic customer support, converter sales agent, technical expert) with custom tone blueprints, dynamically assign personas to contacts/tags, and oversee everything in real-time.

---

## 🚀 Key Features

* 📊 **Interactive Real-Time Dashboard**: Monitor device connection state, active chats, total traffic, and average reply lag times. Dynamic Area and Bar charts visualize AI vs. Human takeover rates.
* 💬 **Built-In Virtual Device Simulator**: Test prompt changes instantly. Send incoming messages from a simulated guest phone number and watch the AI agent process, show a "typing" state, and auto-reply.
* 🤖 **Custom AI Personas Blueprint**: Create, duplicate, and toggle multiple specialized AI personas. Formulate system prompts, rules, and tones to fit specific operations.
* 🏷️ **Contact & Tag Management**: Create/edit customer profiles, assign descriptive tags, write custom memory summaries, and override the global AI persona for specific VIP contacts.
* 📢 **Targeted Broadcast Campaigns**: Compose custom announcement templates and send instant or scheduled broadcasts to selected contacts based on tags.
* 🛡️ **Workspace Backup & Restore**: Instantly export settings, contacts, personas, and activity logs into a single JSON file and restore it to sync workspaces.
* 🔄 **Live Event Feeds**: Completely wired with Socket.IO for immediate status badges, log streaming, and graph updates without browser reloads. Ignored file watching on the database directory prevents annoying flickering during edits.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express, TypeScript, Socket.IO, `@google/genai`
* **Frontend**: React (Vite), Tailwind CSS (v4), Recharts, Lucide Icons, Socket.IO Client
* **Database**: Local file-system persistent JSON storage

---

## ⚙️ Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/) (Optional: falls back to simulated offline replies if missing)

### Installation
1. Clone this repository to your local directory.
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables in `.env` (copied from `.env.example`):
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

### Running Locally
To launch both the Vite development server and the Express TypeScript backend:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Building for Production
To bundle the frontend Vite application and build the backend server into a single executable bundle:
```bash
npm run build
```
To run the production build:
```bash
npm run start
```

### Code Formatting & Type Checks
Verify that the codebase compiles cleanly and satisfies TypeScript rules:
```bash
npm run lint
```

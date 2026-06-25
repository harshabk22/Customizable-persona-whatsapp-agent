# Customizable Persona WhatsApp Agent Dashboard

This project is a dashboard that allows you to manage automated WhatsApp replies using the Gemini API. You can connect a virtual WhatsApp number, customize AI personas with different system prompts and tones, assign them to contacts, and send broadcast campaigns to specific customer tag groups.

## Features

- **Dashboard Overview**: View your connection status, message count statistics, and system activity logs in one place. Includes basic charts comparing AI replies vs. human takeover.
- **WhatsApp Simulator**: Send messages from a simulated customer phone directly in the app to test how your AI agent replies.
- **Custom Personas**: Create and toggle different AI personalities (such as support, sales, or technical help) with custom system prompts.
- **Contacts Management**: Save your customer contact list, add tags or notes, and assign a specific persona to a contact.
- **Broadcast Announcements**: Send instant or scheduled broadcast messages to selected contacts or tags.
- **Backup and Restore**: Export your personas, contacts, and settings to a JSON file and restore them anytime.
- **Real-Time Updates**: Status updates, logs, and new messages update instantly on the screen using WebSockets.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Database**: Local JSON files stored in the workspace

## Getting Started

### Prerequisites

You will need Node.js installed on your machine and a Gemini API Key.

### Installation

1. Clone this repository to your local machine.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (based on `.env.example`) and add your API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

### Running Locally

To start the local development server:
```bash
npm run dev
```
Once started, open your browser and navigate to `http://localhost:3000`.

### Building for Production

To compile and package the application:
```bash
npm run build
```
To run the production build:
```bash
npm run start
```

# Context Capsule 🧪 (Formerly Memshare)

**A Proactive AI Workflow Orchestrator and Collaborative Intelligence Layer for Large Language Models.**

![Context Capsule - Scrape & Hand-off View](https://github.com/user-attachments/assets/38c05871-2003-4b40-acf8-11c1deb61ad2)
![Context Capsule - LLM Injection Options](https://github.com/user-attachments/assets/8aefdbd6-a07a-41b1-83a4-94b9717459fc)
![Context Capsule - History View](https://github.com/user-attachments/assets/cab9b6ce-bd5f-4b6d-97ac-49b6d5781d5f) ![Context Capsule - In Action](https://github.com/user-attachments/assets/2c771380-433c-4099-a3ca-845a51663bee)

## ✨ Overview

**Context Capsule** moves beyond simple LLM context memory. It's designed for individuals and teams who constantly juggle multiple LLMs (ChatGPT, Claude, Gemini, Perplexity, etc.) and need to maintain seamless, intelligent, and secure context transfer. Stop re-explaining yourself to every AI – let Context Capsule manage your AI workflow.

## 🚀 Key Features

Context Capsule is built on three pillars: **Instant Transfer**, **Proactive Audit**, and **Live Collaboration**.

### 1. Instant Context Transfer & Platform Optimization
* **Scrape & Summarize:** Quickly extract relevant content from any webpage (articles, documentation, code, chat logs).
* **Smart Summarization:** Get a concise, LLM-optimized summary of the scraped content, tailored to fit context windows.
* **Auto-Injection:** With a single click, inject the full, optimized prompt directly into your chosen LLM's input field.
* **Platform-Specific Prompts:** Capsule intelligently formats the injected context (e.g., using XML tags for Claude, specific structures for Gemini) to maximize the reasoning and effectiveness of the target LLM.

### 2. Local History & Management
* **Persistent Memory:** All your generated prompts, context data, suggested platforms, and intents are **saved locally** within the extension.
* **Easy Access:** Review past "hand-offs" anytime in the History tab.
* **Granular Control:** Delete individual history items or clear your entire history with a click.

------- Future scope -------

### 3. Proactive Context Audit (Pro Feature)
* **Token Count Estimation:** Get a real-time estimate of the context's token length *before* injection, helping you avoid exceeding limits and managing API costs.
* **PII & Security Alerts:** Capsule scans the scraped content for common Personal Identifiable Information (PII) or sensitive keys (like API credentials), providing critical warnings to prevent accidental data exposure to public LLMs.

### 4. Real-Time Live Session (Collaborative MVP - Pro Feature)
* **Cross-LLM Collaboration:** Work on the same AI task simultaneously with teammates, even if you're using different LLM platforms (e.g., one on ChatGPT, another on Claude).
* **Synchronized Prompting:** See your teammate's keystrokes in your LLM's input field in real-time, enabling true co-authoring of prompts.
* **Shared Context Pool:** Our backend engine manages all session inputs and LLM responses, consolidating them into a single, token-efficient summary. This ensures all participating LLMs always receive an up-to-date, optimized context for every new turn, eliminating context drift and enhancing collective intelligence.

## 🎯 Why Context Capsule? (Beyond Basic Memory)

While tools like Supermemory offer basic context saving, Context Capsule offers:
* **Proactive Intelligence:** Not just memory, but active auditing and predictive context re-activation.
* **Optimized Workflows:** Tailored prompts for better LLM performance.
* **Secure Operations:** Built-in PII and token warnings.
* **True Collaboration:** Real-time, synchronized teamwork across different LLMs.

## 🚀 Getting Started

### Installation (Developer Mode)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/PremChaurasiya07/memshare.git](https://github.com/PremChaurasiya07/memshare.git)
    cd context-capsule-extension 
    ```
2.  **Install Dependencies (for Google Gemini SDK):**
    ```bash
    npm install @google/generative-ai
    ```
3.  **Load in Chrome/Edge:**
    * Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
    * Enable **"Developer mode"** in the top-right corner.
    * Click **"Load unpacked"** (top-left).
    * Select the `memshare` (or your project's) directory from your computer.
4.  **Pin the Extension:** Click the puzzle icon (Extensions) in your browser toolbar and pin "Context Capsule" for easy access.

### Setting up Gemini API Key (Optional, for full functionality)

For the summarization and context audit features using Google Gemini, you will need to provide an API key.
1.  Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Future Feature:** A settings page will be added to securely store this key in your extension's local storage. For now, you might need to hardcode it for development or implement a temporary input mechanism.

## 🤝 Contribution

We welcome contributions! If you have suggestions, bug reports, or want to contribute code, please open an issue or submit a pull request.


---

# AI Concierge & Web Orchestrator

A modular, production-grade AI concierge and orchestration system built with **Next.js** and **TypeScript**, designed to provide real-time user assistance, intelligent navigation, and secure tool execution.

This project demonstrates a two-pass AI architecture combining intent detection, tool invocation, and contextual reasoning for scalable, agentic web experiences.

---

## ✨ Overview

AI Concierge & Web Orchestrator is an embedded assistant framework that enables websites and platforms to offer:

* Guided user journeys
* Context-aware recommendations
* Dynamic routing
* Secure AI-powered automation

It is designed to function as both a **production-ready system** and a **portfolio-grade reference architecture** for advanced AI integration.

---

## 🚀 Key Features

### 🤖 Interactive Concierge Widget

* Real-time chat interface
* Persistent session memory
* Context-aware responses
* Inline navigation links

### 🔁 Two-Pass Orchestration Engine

* First pass: intent analysis + tool selection
* Second pass: response synthesis
* Improves reliability and interpretability

### 🧭 Dynamic Navigation

* AI responses can trigger guided routing
* Deep linking via structured markers

### 📦 Bundle & Offer Logic

* Time-limited bundle recommendations
* Countdown timers
* In-widget promotions

### 🔐 Enterprise Guardrails

* Rate limiting
* Input sanitization
* Prompt injection filtering
* Role validation
* Message length constraints

### 📱 Multi-Entry UI System

* Header trigger button
* Footer call-to-action
* Mobile floating action button
* Global widget launcher

---

## 🏗 Architecture

```text
Frontend (Next.js / React)
 ├─ Concierge Widget (UI Shell)
 ├─ Trigger Components
 ├─ Zustand State Management
 └─ UI Interaction Layer

Backend (API Routes)
 ├─ Request Validation
 ├─ Rate Limiting
 ├─ Tool Call Loop
 ├─ Response Synthesis
 └─ OpenAI Integration

AI Orchestration Layer
 ├─ Intent Detection
 ├─ Tool Invocation
 └─ Context Management
```

### Two-Pass Flow

1. User input is analyzed for intent and required tools
2. Selected tools are executed
3. Results are re-injected into the model
4. Final response is synthesized and returned

This structure improves stability and prevents unreliable single-pass behavior.

---

## 📁 Project Structure

```text
components/
  concierge/
    ConciergeWidget.tsx
    ConciergeHeaderButton.tsx
    ConciergeFooterButton.tsx
    ConciergeMobileButton.tsx

app/
  api/
    concierge/
      route.ts
```

---

## ⚙️ Installation

```bash
git clone https://github.com/Qolqos/ai-agent-web-orchestrator.git
cd ai-agent-web-orchestrator
npm install
```

---

## ▶️ Running Locally

```bash
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

## 🔑 Environment Configuration

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
CONCIERGE_MAX_TOKENS=700
CONCIERGE_SYSTEM_PROMPT=your_system_prompt
```

---

## 🧩 Integration Guide

### Add Widget to Layout

```tsx
import { ConciergeWidget } from "@/components/concierge/ConciergeWidget";

<ConciergeWidget />
```

### Add Trigger Buttons

```tsx
<ConciergeHeaderButton />
<ConciergeFooterButton />
<ConciergeMobileButton />
```

These components connect to the global concierge store and control widget state.

---

## 🛡 Security Model

The system is designed with multiple layers of protection:

* Per-IP rate limiting
* Request throttling
* Sanitized user inputs
* Controlled tool execution
* Output validation
* Defensive prompt handling

These safeguards support deployment in production environments.

---

## 📌 Use Cases

* AI-powered customer support
* Product recommendation systems
* Guided onboarding
* Internal knowledge assistants
* Workflow automation interfaces
* Portfolio and demonstration systems

---

## 🧠 Design Philosophy

This project emphasizes:

* Deterministic orchestration
* Transparent AI behavior
* Modular extensibility
* Production-readiness
* Maintainable automation systems
* Long-term scalability

The architecture favors reliability and auditability over opaque autonomy.

---

## 👤 Author

**Kareem Singleton**
(@Qolqos)

AI Systems Architect
Automation Engineer
Product Builder

---

## ⚖️ License & Usage

Copyright © 2026 Kareem Singleton

This repository is published for demonstration and portfolio purposes.

Commercial use, redistribution, or modification requires explicit written permission from the author.

All rights reserved.

---

## 📄 Status

This project is actively evolving and serves as part of a broader AI systems portfolio.

Features, interfaces, and internal architecture may change over time.

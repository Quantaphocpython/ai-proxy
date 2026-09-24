# AI Proxy Unified Hub (`ai-proxy`)

A unified AI Gateway and multi-user chat platform combining **[LibreChat](https://github.com/danny-avila/LibreChat)** (an open-source AI Chat UI) and **[LiteLLM Proxy](https://github.com/BerriAI/litellm)** (an AI Gateway for API Key management, load balancing, budget caps, and multi-provider routing).

---

## Architecture Topology

The diagram below illustrates the interaction between end users, LibreChat, LiteLLM Proxy, and upstream LLM providers:

```mermaid
graph TD
    User[End Users] -->|Chat UI Interface| LC[LibreChat Service]
    Admin[Admin Administrator] -->|Key & Budget Management via Web UI| LLM_UI[LiteLLM Admin UI]
    
    subgraph AI Gateway Hub
        LC -->|Master / Virtual Key| LLM_Proxy[LiteLLM Proxy Server]
        LLM_UI --- LLM_Proxy
    end
    
    LLM_Proxy -->|OpenAI Key| OpenAI[OpenAI API]
    LLM_Proxy -->|OpenRouter Key| OpenRouter[OpenRouter API]
    LLM_Proxy -->|NVIDIA Key| NVIDIA[NVIDIA NIM API]
    LLM_Proxy -->|Anthropic Key| Anthropic[Anthropic API]
    LLM_Proxy -->|Groq / DeepSeek Key| Other[Other LLM Providers...]
```

---

## Repository Structure

```text
ai-proxy/
├── LibreChat/          # User Interface Layer (Chat Platform)
│   ├── librechat.yaml  # Connection config pointing to LiteLLM Proxy
│   ├── api/            # Backend server (Node.js/Express)
│   └── client/         # Frontend web application (React/Vite)
│
└── litellm/            # AI Gateway Layer (Proxy Server & Admin Dashboard)
    ├── ui/             # Web Admin Dashboard for Keys, Budgets & Analytics
    ├── Dockerfile      # Dockerfile for running LiteLLM Proxy Engine
    ├── render.yaml     # Render Cloud deployment blueprint
    └── ...
```

---

## Key Features

1. **Zero API Key Leakage:** End users log in to LibreChat, select their preferred model, and start chatting. All upstream API keys are securely managed server-side inside LiteLLM Proxy.
2. **Intuitive Web Admin UI:** Admins can dynamically add, update, or rotate API keys (OpenAI, OpenRouter, NVIDIA NIM, Anthropic...) directly via LiteLLM's Web Dashboard without modifying code or redeploying.
3. **Dynamic Model Synchronization (`fetch: true`):** Whenever an admin enables new models in LiteLLM Proxy UI, LibreChat automatically syncs and populates the model selector in real time.
4. **Spend Controls & Rate Limiting:** Set monthly spend budgets and rate limits per API key, team, or user.
5. **High Availability & Fallbacks:** Automatically fall back to backup LLM providers if the primary endpoint experiences latency or downtime.

---

## Deployment Guide (Render Cloud)

### Step 1: Create PostgreSQL Database (For LiteLLM Admin UI)
1. Log in to [Render Dashboard](https://dashboard.render.com) -> Click **New +** -> Select **PostgreSQL**.
2. Name the database: `litellm-db`.
3. Copy the **Internal Database URL** once created (e.g., `postgresql://user:pass@dpg-xxxx.render.com/litellm-db`).

### Step 2: Deploy LiteLLM Proxy Web Service
1. On Render Dashboard -> Click **New +** -> Select **Web Service** -> Choose **Deploy an existing image**.
2. Enter the official Docker Image: `ghcr.io/berriai/litellm:main-latest`
3. Configure **Environment Variables**:
   - `PORT`: `4000`
   - `LITELLM_MASTER_KEY`: `sk-litellm-master-secret-key` *(Set your custom master key)*
   - `UI_USERNAME`: `admin` *(Admin UI username)*
   - `UI_PASSWORD`: `YourSecurePassword123!` *(Admin UI password)*
   - `DATABASE_URL`: *(Paste the Postgres Internal URL from Step 1)*

### Step 3: Configure LibreChat to Connect to LiteLLM
1. Verify `LibreChat/librechat.yaml` contains the custom endpoint:
   ```yaml
   version: 1.3.5
   cache: true

   endpoints:
     custom:
       - name: "AI Gateway"
         apiKey: "${LITELLM_MASTER_KEY}"
         baseURL: "${LITELLM_BASE_URL}" # e.g., https://litellm-service.onrender.com/v1
         models:
           default: ["gpt-4o-mini"]
           fetch: true
         titleConvo: true
         titleModel: "gpt-4o-mini"
         modelDisplayLabel: "AI Gateway (LiteLLM)"
   ```
2. Set Environment Variables on the LibreChat Web Service in Render:
   - `LITELLM_MASTER_KEY`: `sk-litellm-master-secret-key`
   - `LITELLM_BASE_URL`: `https://<your-litellm-service>.onrender.com/v1`

---

## Admin UI & Key Management

Once LiteLLM Proxy is deployed and live:
1. Open the Admin UI: `https://<your-litellm-service>.onrender.com/ui`
2. Log in using `UI_USERNAME` and `UI_PASSWORD`.
3. Navigate to **Models** / **Keys** to add your upstream API keys (OpenRouter, NVIDIA NIM, OpenAI, Anthropic...).
4. Launch LibreChat — all enabled models will automatically appear in the model selector!

---

## License
This monorepo combines two open-source projects:
- **LibreChat**: MIT License
- **LiteLLM**: Apache 2.0 License

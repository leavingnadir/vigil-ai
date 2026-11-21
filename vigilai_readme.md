# VigilAI — AI-Powered Zero-Trust NetSecOps & Firewall ACL Architect

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20TailwindCSS-0284c7)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688)
![Theme](https://img.shields.io/badge/Theme-Light%20Mode-sky)

**VigilAI** is an enterprise-grade NetSecOps utility that translates plain-English network security intents into syntax-verified CLI configurations across multiple firewall vendors (**Cisco IOS**, **Linux iptables**, and **Palo Alto PAN-OS**). Every generated ruleset is subjected to an automated 1–10 Zero-Trust Risk Audit to catch dangerous wildcard exposures (`0.0.0.0/0`) and unencrypted management port access prior to deployment.

---

## 🌟 Key Features

* **Natural Language Policy Translation**: Describe traffic rules in human terms (e.g., *"Allow HTTPS from Admin VLAN 10.10.20.0/24 to Web Server 192.168.50.10 and deny all other traffic"*) and obtain exact CLI syntax immediately.
* **Multi-Vendor CLI Generation**: Produces simultaneous configuration snippets for:
  * **Cisco IOS Extended ACLs** (`access-list ...`)
  * **Linux iptables** (`iptables -A INPUT ...`)
  * **Palo Alto PAN-OS CLI** (`set rulebase security rules ...`)
* **Automated Zero-Trust Security Audit**:
  * Calculates a **1–10 Risk Score** and exposure level indicator.
  * Identifies overly broad `0.0.0.0/0` permits, exposed management ports (SSH/RDP), and missing default-deny rules.
  * Generates actionable hardening guidance following least-privilege principles.
* **Persistent Audit History (`localStorage`)**: Automatically archives up to 25 past rule generations with full vendor outputs, prompts, timestamps, and risk assessments for instant retrieval.
* **Slide-Over History Drawer & Recent Runs Grid**: Browse, reload, or delete past security audits anytime without losing state.
* **One-Click Quick Presets**: Test or demo pre-configured network scenarios with single-click sample chips.
* **Full Config & Audit `.txt` Export**: Download complete documentation bundles containing vendor CLIs, audit findings, and recommendations as clean text reports.
* **Modern Light-Mode Aesthetic**: Styled with a clean Sky Blue & Deep Slate enterprise theme.

---

## 🏗️ System Architecture

```
                                +---------------------------+
                                |      User Browser UI      |
                                |  (React + Tailwind CSS)   |
                                +-------------+-------------+
                                              |
                                     REST API | JSON Payload
                                              v
                                +-------------+-------------+
                                |      FastAPI Backend      |
                                |    (Python 3.10+ / AI)    |
                                +-------------+-------------+
                                              |
                   +--------------------------+--------------------------+
                   |                          |                          |
                   v                          v                          v
       +-----------------------+  +-----------------------+  +-----------------------+
       | Cisco IOS ACL Engine  |  | Linux iptables Engine |  | Palo Alto CLI Engine  |
       +-----------------------+  +-----------------------+  +-----------------------+
```

---

## 📁 Repository Structure

```text
vigilai/
├── backend/
│   ├── main.py              # FastAPI application server & API routes
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Python virtual environment (ignored in git)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Complete React single-file interface & engine
│   │   ├── main.jsx         # React application entry point
│   │   └── index.css        # Tailwind CSS imports & global styles
│   ├── package.json         # Node.js dependencies & scripts
│   └── vite.config.js       # Vite configuration
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v18.0 or higher)
* **Python** (v3.10 or higher)
* **npm** or **yarn**

---

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   * **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/venv/activate
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will start running at `http://localhost:8000`.*

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal tab/window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install Node.js packages:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173`.*

---

## 🔌 API Reference

### `POST /api/generate`

Generates vendor CLI configurations and performs a zero-trust audit based on input intent.

#### Request Body
```json
{
  "prompt": "Allow HTTPS traffic from Admin VLAN 10.10.20.0/24 to Web Server 192.168.50.10 and deny all other traffic.",
  "environment": "Production Enterprise"
}
```

#### Response Body (`200 OK`)
```json
{
  "cisco_ios_acl": "ip access-list extended ADMIN_TO_WEB\n permit tcp 10.10.20.0 0.0.0.255 host 192.168.50.10 eq 443\n deny ip any any log",
  "linux_iptables": "iptables -A INPUT -p tcp -s 10.10.20.0/24 -d 192.168.50.10 --dport 443 -j ACCEPT\niptables -A INPUT -j DROP",
  "palo_alto_cli": "set rulebase security rules ALLOW_ADMIN_HTTPS from ADMIN_VLAN to WEB_ZONE source 10.10.20.0/24 destination 192.168.50.10 service service-https action allow",
  "risk_score": 2,
  "risk_level": "LOW",
  "security_warnings": [
    "Traffic correctly constrained to single host destination (192.168.50.10).",
    "Explicit deny-all rule attached at end of chain."
  ],
  "hardened_suggestion": "Rule adheres to least-privilege principles. Ensure stateful inspection is enabled on boundary interfaces."
}
```

---

## 💡 Usage Workflow

1. **Launch App**: Open `http://localhost:5173` to view the light-mode Hero homepage.
2. **Access Console**: Click **Get Started** or **Launch Console**.
3. **Select Environment & Intent**: Select a target zone (*Production Enterprise*, *DMZ*, or *Home Lab*) or pick a quick scenario preset.
4. **Generate Rules**: Click **Generate & Audit Rules** to run the backend engine.
5. **Inspect & Copy**: Switch between Cisco, iptables, and Palo Alto tabs to copy syntax to your clipboard.
6. **Review Audit**: Check the risk meter score, security warnings, and zero-trust recommendations.
7. **Export or Reload**: Click **Export Full Report (.txt)** to save documentation locally, or use **Saved Audits** to recall previous runs anytime.

---

## 🛡️ Security & Zero-Trust Best Practices

VigilAI audits rule policies against industry-standard benchmarks:
* **Least Privilege**: Flags wildcard `/0` sources/destinations.
* **Management Isolation**: Warns against unconstrained port 22 (SSH), 3389 (RDP), or 23 (Telnet) exposure.
* **Implicit Deny Enforcement**: Ensures all generated rulesets conclude with explicit logging or drop rules.

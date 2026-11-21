import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Copy,
  Sparkles,
  Check,
  AlertTriangle,
  ArrowRight,
  Lock,
  Layers,
  Activity,
  ChevronLeft,
  History,
  Download,
  Trash2,
  Clock,
  X,
  Server,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "vigilai_audit_history_v1";

const PRESET_SCENARIOS = [
  {
    label: "Safe Internal HTTPS",
    env: "Production Enterprise",
    prompt:
      "Allow HTTPS traffic from Admin VLAN 10.10.20.0/24 to Web Server 192.168.50.10 and deny all other traffic.",
  },
  {
    label: "Risky Public SSH/RDP",
    env: "DMZ / Public Facing",
    prompt:
      "Open SSH port 22 and RDP port 3389 from anywhere on the internet to internal server 10.0.1.50.",
  },
  {
    label: "DMZ Database Isolation",
    env: "Production Enterprise",
    prompt:
      "Allow web servers in DMZ 172.16.10.0/24 to query MySQL database 10.20.30.5 on port 3306, block ICMP.",
  },
];

export default function App() {
  // Navigation & Drawer states
  const [view, setView] = useState("home");
  const [historyOpen, setHistoryOpen] = useState(false);

  // Policy input & result states
  const [prompt, setPrompt] = useState("");
  const [environment, setEnvironment] = useState("Production Enterprise");
  const [activeTab, setActiveTab] = useState("cisco");
  const [result, setResult] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Persistent History state (loaded from localStorage)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync history changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }
  }, [history]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, environment }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate rules");
      }

      const newEntry = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        timestamp: new Date().toLocaleString([], {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        prompt: prompt.trim(),
        environment,
        result: data,
      };

      setResult(data);
      setActiveHistoryId(newEntry.id);
      setHistory((prev) => [newEntry, ...prev].slice(0, 25));
    } catch (err) {
      setError(
        err.message ||
          "Error connecting to FastAPI backend. Make sure uvicorn is running!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (entry) => {
    setPrompt(entry.prompt);
    setEnvironment(entry.environment);
    setResult(entry.result);
    setActiveHistoryId(entry.id);
    setError(null);
    setHistoryOpen(false);
    setView("checker");
  };

  const handleDeleteHistoryItem = (e, id) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
  };

  const handleCopy = () => {
    if (!result) return;
    const text =
      activeTab === "cisco"
        ? result.cisco_ios_acl
        : activeTab === "iptables"
        ? result.linux_iptables
        : result.palo_alto_cli;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExportTxt = () => {
    if (!result) return;
    const content = [
      "============================================================",
      "VIGILAI // FIREWALL & ACL ARCHITECTURE REPORT",
      "============================================================",
      `Generated:   ${new Date().toLocaleString()}`,
      `Environment: ${environment}`,
      `Risk Score:  ${result.risk_score}/10 (${result.risk_level})`,
      "",
      "--- ORIGINAL INTENT ---",
      prompt,
      "",
      "--- 1. CISCO IOS EXTENDED ACL ---",
      result.cisco_ios_acl,
      "",
      "--- 2. LINUX IPTABLES ---",
      result.linux_iptables,
      "",
      "--- 3. PALO ALTO PAN-OS CLI ---",
      result.palo_alto_cli,
      "",
      "--- ZERO-TRUST AUDIT FINDINGS ---",
      ...result.security_warnings.map((w, idx) => `${idx + 1}. ${w}`),
      "",
      "--- HARDENING ADVICE ---",
      result.hardened_suggestion,
      "============================================================",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vigilai-policy-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getRiskBadgeStyle = (level) => {
    if (level === "LOW")
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (level === "MEDIUM")
      return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getRiskBarColor = (score) => {
    if (score <= 3) return "bg-emerald-500";
    if (score <= 6) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <span>
              Vigil<span className="text-sky-600">AI</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            {/* Saved History Trigger Button */}
            <button
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <History className="w-4 h-4 text-sky-600" />
              <span>Saved Audits</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white text-sky-700 border border-slate-200">
                {history.length}
              </span>
            </button>

            {view === "checker" ? (
              <button
                onClick={() => setView("home")}
                className="text-sm font-medium text-slate-600 hover:text-sky-600 px-3 py-2 flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Home
              </button>
            ) : (
              <button
                onClick={() => setView("checker")}
                className="text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
              >
                Launch Console
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* SLIDE-OVER HISTORY DRAWER */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setHistoryOpen(false)}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-2xs transition-opacity"
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    Saved Policy Audits
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click any previous run to inspect full CLI &amp; risk details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
              {history.length === 0 ? (
                <div className="text-center py-16 px-6 space-y-2">
                  <Clock className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    No saved audits yet
                  </p>
                  <p className="text-xs text-slate-500">
                    Every policy you generate will be saved here automatically with full vendor outputs.
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const isSelected = item.id === activeHistoryId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistory(item)}
                      className={`group rounded-xl p-4 border transition cursor-pointer ${
                        isSelected
                          ? "bg-sky-50/70 border-sky-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRiskBadgeStyle(
                            item.result.risk_level
                          )}`}
                        >
                          {item.result.risk_level} ({item.result.risk_score}/10)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.timestamp}
                          </span>
                          <button
                            onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                            title="Delete entry"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                        {item.prompt}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          <Server className="w-3 h-3 text-slate-400" />
                          {item.environment}
                        </span>
                        <span className="text-sky-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                          View Report &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {history.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Stored locally in browser ({history.length}/25)
                </span>
                <button
                  onClick={handleClearHistory}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* VIEW 1: HERO HOMEPAGE */}
      {view === "home" && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/70 via-slate-50 to-slate-50" />

          <div className="max-w-5xl mx-auto px-6 pt-20 pb-28 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              AI-Powered Zero-Trust NetSecOps
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Translate Plain English into{" "}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Audited Firewall Rules
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed">
              Instantly generate syntax-verified configurations for{" "}
              <strong className="font-semibold text-slate-800">
                Cisco IOS ACLs
              </strong>
              ,{" "}
              <strong className="font-semibold text-slate-800">
                Linux iptables
              </strong>
              , and{" "}
              <strong className="font-semibold text-slate-800">
                Palo Alto CLI
              </strong>
              —complete with an automated 1–10 security risk audit.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setView("checker")}
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="pt-14 grid sm:grid-cols-3 gap-6 text-left">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Multi-Vendor CLI
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  One natural-language policy outputs Cisco IOS, iptables, and PAN-OS rules simultaneously.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Automated Risk Score
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Detects overly broad{" "}
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                    0.0.0.0/0
                  </code>{" "}
                  permits and exposed management ports before deployment.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Audit History &amp; Export
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Every generated ruleset is archived locally so you can revisit findings or export documented configs anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VIEW 2: NEXT-LEVEL FIREWALL & ACL CHECK PAGE */}
      {view === "checker" && (
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Trust Policy Engine Ready
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Firewall &amp; ACL Policy Architect
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
                Describe your network traffic intent below to generate multi-vendor firewall syntax and run an automated zero-trust security audit.
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="self-start md:self-center inline-flex items-center gap-2.5 bg-sky-50 hover:bg-sky-100/80 text-sky-700 border border-sky-200 font-semibold text-sm px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0"
              >
                <History className="w-4 h-4" />
                Inspect {history.length} Saved {history.length === 1 ? "Run" : "Runs"}
              </button>
            )}
          </div>

          {/* Policy Composer Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            {/* Top Row: Label + Environment Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-600" />
                Describe Desired Traffic Policy
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Target Zone:</span>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option>Production Enterprise</option>
                  <option>DMZ / Public Facing</option>
                  <option>Home Lab / Internal</option>
                </select>
              </div>
            </div>

            {/* Quick-Fill Scenario Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Presets:
              </span>
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setPrompt(preset.prompt);
                    setEnvironment(preset.env);
                  }}
                  className="text-xs font-medium bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Textarea Input */}
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Allow HTTPS traffic from Admin VLAN 10.10.20.0/24 to Web Server 192.168.50.10 and deny all other traffic..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition text-sm sm:text-base leading-relaxed"
            />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Analyzing & Generating Rules..." : "Generate & Audit Rules"}
              </button>

              {result && (
                <button
                  onClick={handleExportTxt}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-600" />
                  Export Full Report (.txt)
                </button>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Generated Output & Audit Results */}
          {result && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Multi-Vendor CLI Card */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-2">
                  <div className="flex">
                    {[
                      { id: "cisco", label: "Cisco IOS ACL" },
                      { id: "iptables", label: "Linux iptables" },
                      { id: "palo", label: "Palo Alto CLI" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 sm:px-5 py-3.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
                          activeTab === tab.id
                            ? "border-sky-600 text-sky-600 bg-white"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="mr-2 my-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    {copied ? "Copied!" : "Copy CLI"}
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <pre className="bg-slate-100 border border-slate-200/90 rounded-xl p-5 font-mono text-sm text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {activeTab === "cisco" && result.cisco_ios_acl}
                    {activeTab === "iptables" && result.linux_iptables}
                    {activeTab === "palo" && result.palo_alto_cli}
                  </pre>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Environment: {environment}</span>
                    <span>Auto-saved to Audit History</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Zero-Trust Security Audit Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-base">
                    Zero-Trust Audit
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeStyle(
                      result.risk_level
                    )}`}
                  >
                    {result.risk_level} ({result.risk_score}/10)
                  </span>
                </div>

                {/* Visual Risk Gauge Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Exposure Level</span>
                    <span>{result.risk_score * 10}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getRiskBarColor(
                        result.risk_score
                      )}`}
                      style={{ width: `${result.risk_score * 10}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                    Audit Findings
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-700">
                    {result.security_warnings.map((warn, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {result.risk_score >= 6 ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-snug">{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 bg-sky-50/60 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <p className="text-xs uppercase tracking-wider text-sky-700 font-bold mb-1.5">
                    Hardening Recommendation
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {result.hardened_suggestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Audits Preview Strip (Always visible on Check Page when history exists) */}
          {history.length > 0 && (
            <section className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Recent Policy Runs ({history.length})
                </h2>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  Open Full History Drawer &rarr;
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.slice(0, 6).map((item) => {
                  const isActive = item.id === activeHistoryId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistory(item)}
                      className={`rounded-xl p-4 border transition cursor-pointer flex flex-col justify-between gap-3 ${
                        isActive
                          ? "bg-sky-50/60 border-sky-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRiskBadgeStyle(
                              item.result.risk_level
                            )}`}
                          >
                            {item.result.risk_level} ({item.result.risk_score}/10)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">
                          {item.prompt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">{item.environment}</span>
                        <span className="font-semibold text-sky-600">
                          Load Details &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
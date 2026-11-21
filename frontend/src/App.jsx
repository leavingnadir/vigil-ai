import { useState } from "react";
import { ShieldAlert, ShieldCheck, Terminal, Copy, Sparkles, Check, AlertTriangle } from "lucide-react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [environment, setEnvironment] = useState("Production Enterprise");
  const [activeTab, setActiveTab] = useState("cisco");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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
      setResult(data);
    } catch (err) {
      setError(err.message || "Error connecting to FastAPI backend. Make sure uvicorn is running!");
    } finally {
      setLoading(false);
    }
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

  const getRiskColor = (level) => {
    if (level === "LOW") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (level === "MEDIUM") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-400 flex items-center gap-3">
            <Terminal className="w-8 h-8" /> VigilAI // Firewall &amp; ACL Architect
          </h1>
          <p className="text-slate-400 mt-2">
            Translate plain-English network policies into multi-vendor firewall syntax with automated zero-trust auditing.
          </p>
        </div>

        {/* Input Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <label className="text-sm font-medium text-slate-300">Describe Desired Traffic Policy</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              <option>Production Enterprise</option>
              <option>DMZ / Public Facing</option>
              <option>Home Lab / Internal</option>
            </select>
          </div>

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Allow SSH from 10.0.5.0/24 to database servers 10.0.20.0/24, log all denied attempts..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-100 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Analyzing & Generating Rules..." : "Generate & Audit Rules"}
          </button>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg p-3.5 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {result && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left 2 Columns: Vendor CLI Tabs */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex border-b border-slate-800 bg-slate-950/60">
                {[
                  { id: "cisco", label: "Cisco IOS ACL" },
                  { id: "iptables", label: "Linux iptables" },
                  { id: "palo", label: "Palo Alto CLI" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                      activeTab === tab.id
                        ? "border-cyan-400 text-cyan-400 bg-slate-900"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 relative">
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <pre className="font-mono text-sm text-emerald-300 overflow-x-auto whitespace-pre-wrap pt-6">
                  {activeTab === "cisco" && result.cisco_ios_acl}
                  {activeTab === "iptables" && result.linux_iptables}
                  {activeTab === "palo" && result.palo_alto_cli}
                </pre>
              </div>
            </div>

            {/* Right Column: Security Audit Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Security Audit</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(result.risk_level)}`}>
                  {result.risk_level} ({result.risk_score}/10)
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Findings</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  {result.security_warnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {result.risk_score >= 6 ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-1">Hardening Advice</p>
                <p className="text-xs text-slate-300 leading-relaxed">{result.hardened_suggestion}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
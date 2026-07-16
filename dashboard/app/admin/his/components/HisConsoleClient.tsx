"use client";

import { useState } from "react";
import { testHisConnectionAction, saveHisConfigAction, resolveConflictAction, tryApiRequestAction } from "../actions";

export function HisConsoleClient({ initialConfig, initialLogs, initialConflicts, initialMappings, permissions }: any) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2 border-b border-vin-border">
        {["overview", "config", "explorer", "logs", "mapping", "conflicts"].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 border-b-2 text-sm font-semibold transition-colors ${activeTab === tab ? "border-vin-accent text-white" : "border-transparent text-vin-muted hover:text-vin-text"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-vin-panel p-6 rounded-lg shadow-sm border border-vin-border min-h-[500px] text-vin-text">
        {activeTab === "overview" && <OverviewTab config={initialConfig} logs={initialLogs} />}
        {activeTab === "config" && <ConfigTab config={initialConfig} permissions={permissions} />}
        {activeTab === "explorer" && <ApiExplorerTab permissions={permissions} />}
        {activeTab === "logs" && <LogsTab logs={initialLogs} permissions={permissions} />}
        {activeTab === "mapping" && <MappingTab mappings={initialMappings} permissions={permissions} />}
        {activeTab === "conflicts" && <ConflictsTab conflicts={initialConflicts} permissions={permissions} />}
      </div>
    </div>
  );
}

function OverviewTab({ config, logs }: any) {
  const failedCount = logs.filter((l: any) => !l.success).length;

  return (
    <div className="space-y-4 text-vin-text2">
      <h2 className="text-xl font-semibold text-white">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-vin-border rounded bg-vin-shell shadow-sm">
          <div className="text-sm text-vin-muted">Current Mode</div>
          <div className="text-lg font-medium text-white">{config.mode || "disabled"}</div>
        </div>
        <div className="p-4 border border-vin-border rounded bg-vin-shell shadow-sm">
          <div className="text-sm text-vin-muted">Last Health Status</div>
          <div className="text-lg font-medium text-white">{config.lastHealthStatus || "Unknown"}</div>
        </div>
        <div className="p-4 border border-vin-border rounded bg-vin-shell shadow-sm">
          <div className="text-sm text-vin-muted">Recent Failed Calls (Top 10)</div>
          <div className="text-lg font-medium text-red-400">{failedCount}</div>
        </div>
      </div>
    </div>
  );
}

function ConfigTab({ config, permissions }: any) {
  const [formData, setFormData] = useState({
    mode: config.mode || "disabled",
    baseUrl: config.baseUrl || "",
    authMode: config.authMode || "none",
    apiKey: config.apiKeyEncrypted || "",
    bearerToken: config.bearerTokenEncrypted || "",
    timeoutMs: config.timeoutMs || 10000,
    isActive: config.isActive !== false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveHisConfigAction(formData);
    setLoading(false);
    if (res.success) setMessage("Saved successfully");
    else setMessage(`Error: ${res.error}`);
  };

  const handleTest = async () => {
    setLoading(true);
    const res = await testHisConnectionAction();
    setLoading(false);
    if (res.success) setMessage("Connection successful!");
    else setMessage(`Test failed: ${res.error || res.message}`);
  };

  if (!permissions.includes("his.manage")) return <div>Access Denied</div>;

  return (
    <div className="max-w-2xl text-vin-text2">
      <h2 className="text-xl font-semibold text-white mb-4">Connection Config</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-vin-muted mb-1">Mode</label>
          <select value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value })} className="block w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent">
            <option value="disabled">Disabled</option>
            <option value="mock">Mock</option>
            <option value="rest">REST API</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-vin-muted mb-1">Base URL</label>
          <input type="text" value={formData.baseUrl} onChange={e => setFormData({ ...formData, baseUrl: e.target.value })} className="block w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-vin-muted mb-1">Auth Mode</label>
          <select value={formData.authMode} onChange={e => setFormData({ ...formData, authMode: e.target.value })} className="block w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent">
            <option value="none">None</option>
            <option value="apiKey">API Key</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>
        </div>
        {formData.authMode === "apiKey" && (
          <div>
            <label className="block text-sm font-medium text-vin-muted mb-1">API Key</label>
            <input type="password" value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} className="block w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" />
          </div>
        )}
        {formData.authMode === "bearer" && (
          <div>
            <label className="block text-sm font-medium text-vin-muted mb-1">Bearer Token</label>
            <input type="password" value={formData.bearerToken} onChange={e => setFormData({ ...formData, bearerToken: e.target.value })} className="block w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" />
          </div>
        )}

        <div className="flex items-center space-x-4 pt-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-vin-accent text-white rounded shadow-sm hover:bg-vin-accentHover transition-colors">Save Config</button>
          <button type="button" onClick={handleTest} disabled={loading} className="px-4 py-2 bg-vin-shell text-vin-text border border-vin-border rounded shadow-sm hover:bg-vin-panel transition-colors">Test Connection</button>
        </div>
        {message && <div className="p-3 bg-vin-shell border border-vin-border rounded text-sm text-white">{message}</div>}
      </form>
    </div>
  );
}

function ApiExplorerTab({ permissions }: any) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/his/inbound/health");
  const [payload, setPayload] = useState("{}");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!permissions.includes("his.apiTest")) return <div>Access Denied</div>;

  const handleTry = async () => {
    setLoading(true);
    let parsedPayload = {};
    try {
      if (method !== "GET") parsedPayload = JSON.parse(payload);
    } catch (e) {
      setResponse({ error: "Invalid JSON payload" });
      setLoading(false);
      return;
    }
    const res = await tryApiRequestAction(method, path, parsedPayload);
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-vin-text2">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">API Explorer</h2>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-24 rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm outline-none focus:border-vin-accent">
              <option>GET</option>
              <option>POST</option>
            </select>
            <input type="text" value={path} onChange={e => setPath(e.target.value)} className="flex-1 rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm outline-none focus:border-vin-accent" placeholder="/api/his/inbound/..." />
          </div>
          {method !== "GET" && (
            <textarea value={payload} onChange={e => setPayload(e.target.value)} className="w-full h-48 rounded border border-vin-border bg-vin-shell px-3 py-2 font-mono text-sm outline-none focus:border-vin-accent" placeholder="{}"></textarea>
          )}
          <button onClick={handleTry} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded shadow-sm hover:bg-emerald-700 transition-colors">Try Request</button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">Response</h2>
        <div className="bg-black/50 border border-vin-border text-emerald-400 p-4 rounded min-h-[300px] max-h-[500px] overflow-auto font-mono text-sm whitespace-pre-wrap">
          {response ? JSON.stringify(response, null, 2) : "No request sent yet."}
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs, permissions }: any) {
  if (!permissions.includes("his.apiLogs")) return <div>Access Denied</div>;

  return (
    <div className="space-y-4 text-vin-text2">
      <h2 className="text-xl font-semibold text-white">Call Logs (Top 10)</h2>
      <div className="overflow-x-auto rounded border border-vin-border">
        <table className="min-w-full divide-y divide-vin-border/50 text-sm">
          <thead className="bg-vin-panel2">
            <tr>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Dir</th>
              <th className="px-4 py-2 text-left">Endpoint</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Accession</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vin-border/50 bg-vin-shell">
            {logs.map((l: any) => (
              <tr key={l.id}>
                <td className="px-4 py-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm font-bold ${l.direction === 'INBOUND' ? 'bg-blue-900/30 text-blue-300' : 'bg-purple-900/30 text-purple-300'}`}>{l.direction}</span>
                </td>
                <td className="px-4 py-2 font-mono text-sm">{l.path}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm font-bold ${l.success ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>{l.success ? 'OK' : 'FAILED'}</span>
                </td>
                <td className="px-4 py-2">{l.accessionNumber || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MappingTab({ mappings, permissions }: any) {
  if (!permissions.includes("his.mapping")) return <div>Access Denied</div>;

  return (
    <div className="text-vin-text2">
      <h2 className="text-xl font-semibold text-white mb-4">Field Mapping</h2>
      <p className="text-vin-muted mb-4 text-sm">View currently configured mappings. Creating new mapping via UI will be added soon.</p>
      <div className="overflow-x-auto rounded border border-vin-border">
        <table className="min-w-full divide-y divide-vin-border/50 text-sm">
          <thead className="bg-vin-panel2">
            <tr>
              <th className="px-4 py-2 text-left">Direction</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Source Field</th>
              <th className="px-4 py-2 text-left">Target Field</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vin-border/50 bg-vin-shell">
            {mappings.map((m: any) => (
              <tr key={m.id}>
                <td className="px-4 py-2">{m.direction}</td>
                <td className="px-4 py-2">{m.name}</td>
                <td className="px-4 py-2 font-mono text-sm">{m.sourceField}</td>
                <td className="px-4 py-2 font-mono text-sm text-blue-300">{m.targetField}</td>
              </tr>
            ))}
            {mappings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-vin-muted">No mappings configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConflictsTab({ conflicts, permissions }: any) {
  if (!permissions.includes("his.conflictReview")) return <div>Access Denied</div>;

  const handleResolve = async (id: string, res: "ACCEPTED" | "IGNORED") => {
    await resolveConflictAction(id, res, "Resolved from admin UI");
    window.location.reload();
  };

  return (
    <div className="text-vin-text2">
      <h2 className="text-xl font-semibold text-white mb-4">Conflict Review</h2>
      <div className="space-y-4">
        {conflicts.length === 0 ? <p className="text-vin-muted">No open conflicts.</p> : conflicts.map((c: any) => (
          <div key={c.id} className="border border-vin-border bg-vin-shell p-4 rounded shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold text-red-400">Conflict</span> on <span className="font-mono bg-vin-panel border border-vin-border rounded px-1">{c.entityType}</span> field <span className="font-mono bg-vin-panel border border-vin-border rounded px-1">{c.fieldName}</span>
              </div>
              <div className="text-sm text-vin-muted">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-vin-panel p-2 border border-vin-border rounded">
                <div className="text-sm text-vin-muted uppercase tracking-wider mb-1">Current Value</div>
                <div className="font-mono text-sm text-white">{c.currentValue || "null"}</div>
              </div>
              <div className="bg-blue-900/20 p-2 border border-blue-900/50 rounded">
                <div className="text-sm text-blue-400 uppercase tracking-wider mb-1">Incoming Value</div>
                <div className="font-mono text-sm text-blue-100">{c.incomingValue || "null"}</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleResolve(c.id, "ACCEPTED")} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors">Accept Incoming</button>
              <button onClick={() => handleResolve(c.id, "IGNORED")} className="px-3 py-1 bg-vin-panel border border-vin-border text-vin-text text-sm rounded hover:bg-vin-panel2 transition-colors">Keep Current</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

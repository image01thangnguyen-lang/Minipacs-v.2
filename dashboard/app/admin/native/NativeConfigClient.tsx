'use client'

import React, { useState } from 'react';
import { saveNativeConfigAction, generateNativeSignatureAction } from './actions';

export function NativeConfigClient({ initialConfig }: { initialConfig: any }) {
  const [isEnabled, setIsEnabled] = useState(initialConfig?.isEnabled || false);
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || 'http://127.0.0.1:4000');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState({ text: '', type: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestStatus({ text: 'Testing connection...', type: 'info' });
    try {
      const { timestamp, signature } = await generateNativeSignatureAction('GET', '/health');
      const res = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'x-native-timestamp': timestamp,
          'x-native-signature': signature
        }
      });
      if (res.ok) {
        setTestStatus({ text: 'Connection successful!', type: 'success' });
      } else {
        setTestStatus({ text: `Failed: HTTP ${res.status}`, type: 'error' });
      }
    } catch (e: any) {
      setTestStatus({ text: `Connection error: ${e.message}`, type: 'error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setNewSecret(null);
    setLoading(true);
    try {
      const config = await saveNativeConfigAction(isEnabled, baseUrl);
      setMessage({ text: 'Configuration saved successfully.', type: 'success' });
      if (config.newSharedSecret) {
        setNewSecret(config.newSharedSecret);
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-vin-panel p-6 rounded-lg shadow border border-vin-border">
      <h2 className="text-xl font-semibold mb-4">Companion Configuration</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="isEnabled"
          checked={isEnabled}
          onChange={e => setIsEnabled(e.target.checked)}
          className="h-4 w-4 text-vin-accent border-vin-border rounded focus:ring-vin-accent"
        />
        <label htmlFor="isEnabled" className="ml-2 block text-sm text-vin-text font-medium">
          Enable Native Companion Bridge
        </label>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-vin-text2 mb-1">Local Bridge Base URL</label>
        <p className="text-sm text-vin-muted mb-2">Must be localhost or 127.0.0.1 to prevent SSRF vulnerabilities. Do NOT use remote IPs.</p>
        <input
          type="text"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          disabled={!isEnabled}
          className="w-full border border-vin-border rounded px-3 py-2 disabled:bg-vin-shell disabled:text-vin-muted"
          placeholder="http://127.0.0.1:4000"
        />
      </div>

      {newSecret && (
        <div className="mb-4 p-3 bg-vin-accent/10 border border-vin-accent/30 rounded text-sm">
          <strong className="text-vin-text">Shared Secret Generated:</strong>
          <span className="ml-2 font-mono break-all">{newSecret}</span>
          <p className="text-vin-accent mt-2 font-semibold">Please copy this secret to your Native Companion configuration now. It will not be shown again.</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-vin-accent text-white px-4 py-2 rounded shadow hover:bg-vin-accentHover disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>

        {isEnabled && (initialConfig || newSecret) && (
          <button
            type="button"
            onClick={handleTestConnection}
            className="bg-vin-shell text-vin-text px-4 py-2 rounded shadow hover:bg-vin-tableHover"
          >
            Test Connection
          </button>
        )}
      </div>

      {testStatus.text && (
        <div className={`mt-4 p-3 rounded text-sm ${testStatus.type === 'error' ? 'bg-red-100 text-red-800' : testStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-vin-accent/10 text-vin-accent'}`}>
          {testStatus.text}
        </div>
      )}
    </form>
  );
}

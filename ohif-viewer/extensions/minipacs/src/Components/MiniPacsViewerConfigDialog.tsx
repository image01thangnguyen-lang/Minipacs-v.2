import React, { useState, useEffect } from 'react';
import { viewerPreferenceService } from '../services/viewerPreferenceService';

export function MiniPacsViewerConfigDialog() {
  const [prefs, setPrefs] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    viewerPreferenceService.getPreferences().then(data => {
      if (data) setPrefs(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const success = await viewerPreferenceService.savePreferences(prefs);
    if (success) alert('Saved');
    else alert('Failed to save preferences');
  };

  const handleReset = async () => {
    const success = await viewerPreferenceService.resetPreferences();
    if (success) {
      setPrefs({});
      alert('Reset to defaults');
    } else {
      alert('Failed to reset preferences');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20, color: '#fff', background: '#222' }}>
      <h3>Viewer Preferences</h3>
      <div>
        <label>Toolbar Position:</label>
        <select value={prefs.toolbarPosition || 'top'} onChange={e => setPrefs({...prefs, toolbarPosition: e.target.value})}>
          <option value="top">Top</option>
          <option value="left">Left</option>
        </select>
      </div>
      <div>
        <label>Theme:</label>
        <select value={prefs.theme || 'dark'} onChange={e => setPrefs({...prefs, theme: e.target.value})}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div>
         <label>Anonymize Default:</label>
         <input type="checkbox" checked={prefs.anonymizeDefault || false} onChange={e => setPrefs({...prefs, anonymizeDefault: e.target.checked})} />
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={handleSave}>Save</button>
        <button onClick={handleReset} style={{ marginLeft: 10 }}>Reset</button>
      </div>
    </div>
  );
}

export default MiniPacsViewerConfigDialog;

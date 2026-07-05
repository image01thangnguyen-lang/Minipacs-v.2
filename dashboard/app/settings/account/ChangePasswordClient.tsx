'use client'

import React, { useState } from 'react';
import { changeMyPasswordAction } from './actions';

export function ChangePasswordClient() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await changeMyPasswordAction(currentPassword, newPassword);
      setMessage({ text: 'Password changed successfully. Please sign out to apply everywhere.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      
      {message.text && (
        <div className={`p-3 mb-4 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
        <input 
          type="password" 
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required 
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password (min 8 chars)</label>
        <input 
          type="password" 
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required 
          minLength={8}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <input 
          type="password" 
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-2 rounded font-semibold text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Updating...' : 'Change Password'}
      </button>
    </form>
  );
}

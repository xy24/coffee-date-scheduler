'use client';

import { useState } from 'react';

export default function InvitationForm() {
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          message: message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setStatus('success');
      setRecipientId('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Send Coffee Invitation</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700">
            Recipient ID
          </label>
          <input
            type="text"
            id="recipientId"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter Lark user ID"
            required
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Custom Message (optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            placeholder="Add a personal message..."
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            status === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {status === 'loading' ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
          Invitation sent successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 
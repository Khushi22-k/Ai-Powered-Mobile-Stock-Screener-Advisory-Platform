import React, { useState } from 'react';
import { getAccessToken } from '../utils/auth.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const token = getAccessToken();
    if (!token) {
      setMessages(prev => [...prev, { text: 'Please log in to use the chat.', sender: 'system' }]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: input }),
      });
      const data = await response.json();
      if (response.ok) {
        const llmMessage = { text: data.response, sender: 'llm' };
        setMessages(prev => [...prev, llmMessage]);
      } else {
        setMessages(prev => [...prev, { text: data.message || 'Error getting response', sender: 'system' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Network error. Please try again.', sender: 'system' }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Chat with LLM</h1>
          <p className="text-slate-400">Ask questions and get responses from our AI assistant</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 h-96 overflow-y-auto mb-4">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your query here..."
            className="flex-1 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

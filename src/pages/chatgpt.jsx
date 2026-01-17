import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ArrowUp,
  Search,
  Mic,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import {v4 as uuidv4} from "uuid";
import { useNavigate } from 'react-router-dom';
import { chatGPTQuery } from '/src/utils/chatApi.js';


const ChatGPTClone = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const messagesEndRef = useRef(null);

  const API_BASE = 'http://127.0.0.1:5000';

  const createNewSession = () => {
    const newSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const loadSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const saveSessions = (sessionsToSave) => {
    localStorage.setItem('chatSessions', JSON.stringify(sessionsToSave));
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/auth/fetch_user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log(data.username);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/signin");
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const handleSendMessage = async (e) => {
    if ((e.key === "Enter" || e.type === "click") && query.trim()) {
      const userMessage = query;
      const newMessages = [...messages, { text: userMessage, sender: "user" }];
      setMessages(newMessages);
      setQuery("");
      setLoading(true);

      try {
        const res = await chatGPTQuery(userMessage);
        const botMessage = { text: res.response, sender: "bot" };
        const finalMessages = [...newMessages, botMessage];
        setMessages(finalMessages);
        setSessions(prev => prev.map(sess =>
          sess.id === currentSessionId
            ? { ...sess, messages: finalMessages, title: sess.title === 'New Chat' ? userMessage.slice(0, 30) : sess.title }
            : sess
        ));
      } catch (err) {
        const errorMessage = { text: "Server error. Please try again.", sender: "bot" };
        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        setSessions(prev => prev.map(sess =>
          sess.id === currentSessionId
            ? { ...sess, messages: finalMessages, title: sess.title === 'New Chat' ? userMessage.slice(0, 30) : sess.title }
            : sess
        ));
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div className="flex h-screen bg-[#212121] text-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`border-slate-800 bg-slate-950 via-slate-900 to-slate-950  transition-all duration-300 border-r border-white/5 ${isSidebarOpen ? 'w-64' : 'w-0'} flex flex-col`}>
        <div className="p-4 flex flex-col h-full min-w-[260px]">
          <button onClick={createNewSession} className="flex items-center gap-2 hover:bg-[#2f2f2f] p-3 rounded-xl transition text-sm font-medium">
            <Plus size={18} /> New chat
          </button>
          
          <div className="mt-8 flex-1 overflow-y-auto">
             <div className="flex items-center gap-3 p-2 text-gray-400 hover:text-white cursor-pointer">
                <Search size={16} /> <span className="text-sm">Search</span>
             </div>
             <p className="text-[11px] text-gray-500 font-bold mt-6 mb-2 px-2 uppercase tracking-wider">Recent</p>
             {sessions.map(session => (
               <div key={session.id} className={`text-sm text-gray-300 px-2 py-2 hover:bg-[#2f2f2f] rounded-lg cursor-pointer truncate ${session.id === currentSessionId ? 'bg-[#2f2f2f]' : ''}`} onClick={() => loadSession(session.id)}>
                 {session.title}
               </div>
             ))}
          </div>

          <div className="p-2 mt-auto border-t border-white/10">
            <div className="flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg cursor-pointer">
              <div className="w-8 h-8 bg-orange-700 rounded-full flex items-center justify-center text-[10px]">KS</div>
              <span className="text-sm">username</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-400">
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <span className="font-semibold text-gray-200">Rag Application Assistant</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 rounded-xl border border-slate-700/50 transition"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
        {isMenuOpen && (
          <div className="px-4 pb-4 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/chatgpt')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Advisory Platform
            </button>
            <button
              onClick={() => navigate('/watchlist')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Watchlist
            </button>
            <button
              onClick={() => navigate('/tradingview')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              portfolio
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-slate-50 px-4 py-2 rounded-xl border border-red-500 transition flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto pb-40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h1 className="text-3xl font-semibold mb-8">What can I help with?</h1>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 pt-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-8 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-[#2f2f2f] text-white' : 'bg-transparent text-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM FIXED INPUT */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-10 pb-6">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-[#2f2f2f] rounded-3xl p-2 border border-white/10 flex items-center shadow-2xl">
              <button className="p-2 text-gray-400 hover:text-white"><Plus size={20}/></button>
             <input
  className="flex-1 bg-transparent border-none focus:ring-0 text-white px-3 py-2 outline-none"
  placeholder="Ask anything"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }}
/>

              <div className="flex items-center gap-1 pr-1">
                <button className="p-2 text-gray-400 hover:text-white"><Mic size={20}/></button>
                <button 
                  onClick={handleSendMessage}
                  disabled={!query.trim()}
                  className={`p-2 rounded-full transition ${query.trim() ? 'bg-white text-black' : 'text-gray-600 bg-[#3d3d3d]'}`}
                >
                  <ArrowUp size={20} />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-3">
              ChatGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatGPTClone;
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Signup from './pages/signup.jsx';
import Chatgpt from './pages/chatgpt.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Watchlist from './pages/watchlist.jsx';
import {Chart as ChartJS } from 'chart.js/auto';

function App() {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="p-4 space-x-4">
        <Link to="/">Home</Link>
        <Link to="/signin">Sign In</Link>
        <Link to="/signup">Sign Up</Link>
        
      </nav>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Auth mode="signin" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/signin" />} />
        <Route path="/chatgpt" element={isAuthenticated ? <Chatgpt /> : <Navigate to="/signin" />} />
        <Route path="/watchlist" element={isAuthenticated ? <Watchlist /> : <Navigate to="/signin" />} />
      </Routes>
    </div>
  );
}

export default App;

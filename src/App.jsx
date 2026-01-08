
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import MarketStackData from './pages/CandlestickChart.jsx';
import Signup from './pages/signup.jsx';
import Chatgpt from './pages/chatgpt.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Watchlist from './pages/watchlist.jsx';
import Notifications from './pages/Notifications.jsx';
import TradingViewWidget from './pages/tradingview.jsx';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Auth mode="signin" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/chatgpt" element={<Chatgpt />} />
        <Route path="/tradingview" element={<TradingViewWidget />} />
        <Route path="/CandlestickChart/:symbol?" element={<MarketStackData />} />
      </Routes>
    </div>
  );
}

export default App;

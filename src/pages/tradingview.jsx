import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TradingViewWidget() {
  const container = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/signin");
  };

  useEffect(
    () => {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "allow_symbol_change": true,
          "calendar": false,
          "details": false,
          "hide_side_toolbar": true,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": false,
          "interval": "D",
          "locale": "en",
          "save_image": true,
          "style": "1",
          "symbol": "NASDAQ:AAPL",
          "theme": "dark",
          "timezone": "Etc/UTC",
          "backgroundColor": "#0F0F0F",
          "gridColor": "rgba(242, 242, 242, 0.06)",
          "watchlist": [
            "INFY",
            "NASDAQ:TSLA",
            "NASDAQ:NVDA",
            "NASDAQ:AMZN",
            "NASDAQ:GOOGL",

            "NASDAQ:META"

          ],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [],
          "width": 1200,
          "height": 600
        }`;
      container.current.appendChild(script);
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      <div className={`transition-all duration-300 ${isMenuOpen ? 'w-1/3' : 'w-0'} bg-slate-800/50 border-r border-slate-700/50 overflow-hidden`}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-50 mb-4">Navigation</h2>
          <div className="flex flex-col gap-4">
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
              Portfolio
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-slate-50 px-4 py-2 rounded-xl border border-red-500 transition flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-50">TradingView</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 rounded-xl border border-slate-700/50 transition"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </header>
          <div className="mb-8">
            <p className="text-slate-400">Advanced trading charts and analysis</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-600 shadow-lg">
            <div className="tradingview-widget-container" ref={container}>
              <div className="tradingview-widget-container__widget"></div>
              <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/NASDAQ-AAPL/" rel="noopener nofollow" target="_blank"><span className="blue-text">AAPL stock chart</span></a><span className="trademark"> by TradingView</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingViewWidget;

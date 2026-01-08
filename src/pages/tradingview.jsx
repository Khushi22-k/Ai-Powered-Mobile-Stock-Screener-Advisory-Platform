import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, LogOut, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

function TradingViewWidget() {
  const container = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const { symbol } = useParams();
  const API_BASE = 'http://127.0.0.1:5000';
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchFavoriteStocks();
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/signin");
  };

  const fetchFavoriteStocks = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/favorite-stocks`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Favorite stocks fetch failed");
      const data = await res.json();
      const selectedFavorites = data.filter(fav => fav.status === 'selected');
      setFavoriteStocks(selectedFavorites.map(fav => fav.symbol.toUpperCase()));
    } catch (err) {
      console.error('Failed to fetch favorite stocks:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!token || !symbol) return;

    const isFavorite = favoriteStocks.includes(symbol.toUpperCase());
    const newStatus = isFavorite ? 'unselected' : 'selected';

    try {
      const res = await fetch(`${API_BASE}/auth/favorite-stock`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), status: newStatus })
      });
      if (!res.ok) throw new Error("Toggle favorite failed");
      // Update local state
      if (isFavorite) {
        setFavoriteStocks(prev => prev.filter(s => s !== symbol.toUpperCase()));
      } else {
        setFavoriteStocks(prev => [...prev, symbol.toUpperCase()]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };
  useEffect(
    () => {
      // Clean up existing script
      const existingScript = container.current.querySelector('script');
      if (existingScript) {
        existingScript.remove();
      }

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
          "symbol": "NSE:${symbol || 'AAPL'}",
          "theme": "dark",
          "timezone": "Etc/UTC",
          "backgroundColor": "#ffffff",
          "gridColor": "rgba(46, 46, 46, 0.06)",
          "watchlist": [
            "NASDAQ:TSLA",
            "NASDAQ:NVDA",
            "NASDAQ:AAPL",
            "NASDAQ:AMZN",
            "NASDAQ:META",
            "NASDAQ:MSFT",
            "NASDAQ:NFLX",
            "NSE:RELIANCE",
            "NASDAQ:INTC",
            "NSE:ICICIBANK",
            "NSE:INFY",
            "NSE:BHARTIARTL",
            "NSE:TCS",
            "NSE:BAJFINANCE",
            "NSE:TATASTEEL",
            "NSE:HCLTECH",
            "NSE:AXISBANK",
            "NSE:WIPRO",
            "NSE:ASIANPAINT",
            "NSE:MARUTI",
            "NSE:HINDUNILVR",
            "NSE:UNIONBANK"
          ],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [],
          "width": 1200,
          "height": 600
        }`;
      container.current.appendChild(script);
    },
    [symbol]
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
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-slate-50">Portfolio</h1>
              {symbol && (
                <button
                  onClick={toggleFavorite}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 rounded-xl border border-slate-700/50 transition"
                >
                  <Star
                    size={20}
                    fill={favoriteStocks.includes(symbol.toUpperCase()) ? 'yellow' : 'none'}
                    stroke={favoriteStocks.includes(symbol.toUpperCase()) ? 'yellow' : 'currentColor'}
                  />
                </button>
              )}
            </div>
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
              <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/NASDAQ-AAPL/" rel="noopener nofollow" target="_blank"><span className="blue-text">AAPL stock chart</span></a><span className="trademark"> by Stock Screener</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingViewWidget;

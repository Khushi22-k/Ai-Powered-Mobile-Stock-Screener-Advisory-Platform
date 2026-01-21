import { useState, useEffect } from 'react';
import {
  Menu, X, LogOut, TrendingUp, TrendingDown,
  User, DollarSign, BarChart3, TrendingUp as ProfitIcon,
  Activity, PieChart, Target, Zap, ChevronRight, Star,
  BellDot,
  WrapTextIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Trading() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username] = useState(localStorage.getItem('username') || '');

  const [portfolio, setPortfolio] = useState({
    totalInvestment: 0,
    totalStocks: 0,
    totalProfit: 0,
    holdings: []
  });

  const API_BASE = 'http://127.0.0.1:5000';

  const authHeaders = token ? {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  } : null;

  useEffect(() => {
    if (!token) navigate("/signin");
    else fetchPortfolio();
  }, [token]);

  /* ---------------- FETCH PORTFOLIO ---------------- */
  const fetchPortfolio = async () => {
    if (!authHeaders) return;

    try {
      const res = await fetch(`${API_BASE}/auth/portfolio`, {
        headers: authHeaders
      });

      if (!res.ok) throw new Error("Failed to fetch portfolio");

      const data = await res.json(); // array from backend

      const holdings = data.map(item => ({
        symbol: item.symbol,
        quantity: item.quantity,
        avgPrice: Number(item.avg_price ?? 0),
        currentPrice: Number(item.current_price ?? 0),
        profit: Number(item.profit_loss ?? 0),
      }));

      const totalInvestment = holdings.reduce(
        (sum, h) => sum + h.avgPrice * h.quantity, 0
      );

      const totalProfit = holdings.reduce(
        (sum, h) => sum + h.profit, 0
      );

      setPortfolio({
        totalInvestment,
        totalStocks: holdings.length,
        totalProfit,
        holdings,
      });

    } catch (err) {
      console.error(err);
      setError("Unable to load portfolio");
    }
  };

  /* ---------------- SELL STOCK ---------------- */
  const handleSellStock = async (symbol, quantity) => {
    try {
      const res = await fetch(`${API_BASE}/auth/sell`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ symbol, quantity })
      });

      if (!res.ok) throw new Error();

      setSuccess(`Sold ${quantity} shares of ${symbol}`);
      fetchPortfolio();

    } catch {
      setError("Sell failed");
    }
  };

  /* ---------------- STOCK PRICE ---------------- */
  const fetchStockPrice = async (sym) => {
    if (!sym) return;
    try {
      const res = await fetch(`${API_BASE}/auth/stock/${sym}`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrentPrice(Number(data.price ?? 0));
    } catch {
      setCurrentPrice(null);
    }
  };

  const handleTrade = async (action) => {
    if (!symbol || !quantity || !currentPrice) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/${action}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          symbol,
          quantity: Number(quantity),
          price: currentPrice
        })
      });

      if (!res.ok) throw new Error();

      setSuccess(`${action.toUpperCase()} successful`);
      fetchPortfolio();
      setSymbol('');
      setQuantity('');
      setCurrentPrice(null);

    } catch {
      setError("Trade failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-500 ease-in-out ${
        isMenuOpen ? 'w-80' : 'w-0'
      } bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 overflow-hidden shadow-2xl`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FinStocks</span>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200 group"
            >
              <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Dashboard</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

             <button
              onClick={() => navigate('/chatgpt')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200 group"
            >
              < WrapTextIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Advisory Platform</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200 group"
            >
              < BellDot className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Notifications</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate('/watchlist')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all duration-200 group"
            >
              <Star className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Watchlist</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-500 ${isMenuOpen ? 'ml-80' : 'ml-0'} flex-1 p-8`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trading Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Welcome back, {username}!</p>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-slate-600/50"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-slate-300" /> : <Menu className="w-6 h-6 text-slate-300" />}
          </button>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400 opacity-60" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              ${portfolio.totalInvestment.toLocaleString()}
            </div>
            <div className="text-slate-400 text-sm">Total Investment</div>
          </div>

          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                <PieChart className="w-8 h-8 text-blue-400" />
              </div>
              <Activity className="w-5 h-5 text-blue-400 opacity-60" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {portfolio.totalStocks}
            </div>
            <div className="text-slate-400 text-sm">Active Positions</div>
          </div>

          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <ProfitIcon className={`w-5 h-5 opacity-60 ${portfolio.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div className={`text-2xl font-bold mb-1 ${portfolio.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${portfolio.totalProfit.toLocaleString()}
            </div>
            <div className="text-slate-400 text-sm">Total P&L</div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Holdings</h2>
            <div className="flex items-center space-x-2 text-slate-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Live Updates</span>
            </div>
          </div>

          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No holdings yet</p>
              <p className="text-slate-500 text-sm">Start trading to build your portfolio</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Symbol</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Quantity</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Avg Price</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Current Price</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">P&L</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h, i) => (
                    <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-200">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-cyan-400 font-bold text-sm">{h.symbol.slice(0, 2)}</span>
                          </div>
                          <span className="text-white font-medium">{h.symbol}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{h.quantity}</td>
                      <td className="py-4 px-4 text-slate-300">${h.avgPrice.toFixed(2)}</td>
                      <td className="py-4 px-4 text-slate-300">${h.currentPrice.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${h.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${h.profit.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleSellStock(h.symbol, h.quantity)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 hover:scale-105 border border-red-500/30"
                        >
                          <TrendingDown className="w-4 h-4 inline mr-2" />
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trading Panel */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Quick Trade</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Stock Symbol</label>
                <input
                  value={symbol}
                  onChange={e => {
                    setSymbol(e.target.value.toUpperCase());
                    fetchStockPrice(e.target.value.toUpperCase());
                  }}
                  placeholder="e.g., AAPL"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Quantity</label>
                <input
                  value={quantity}
                  type="number"
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Number of shares"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                />
              </div>

              {currentPrice && (
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Price</span>
                    <span className="text-green-400 font-bold text-lg">${currentPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end space-y-3">
              <button
                onClick={() => handleTrade('buy')}
                disabled={loading || !symbol || !quantity || !currentPrice}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25"
              >
                {loading ? 'Processing...' : (
                  <>
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Buy Stock
                  </>
                )}
              </button>

              <button
                onClick={() => handleTrade('sell')}
                disabled={loading || !symbol || !quantity || !currentPrice}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25"
              >
                {loading ? 'Processing...' : (
                  <>
                    <TrendingDown className="w-5 h-5 inline mr-2" />
                    Sell Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {(error || success) && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
            error
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-green-500/20 border-green-500/30 text-green-400'
          }`}>
            <div className="flex items-center space-x-3">
              {error ? <X className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              <span className="font-medium">{error || success}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

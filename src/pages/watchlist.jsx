import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

export default function Watchlist() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const authHeaders = token ? {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  } : null;

  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCompany, setInputCompany] = useState('');
  const [searchedStock, setSearchedStock] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const API_BASE = 'http://127.0.0.1:5000';

  // Hardcoded companies for boxes
  const companies = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchStockHistory(selectedStock);
    }
  }, [selectedStock]);

  const fetchStocks = async () => {
    if (!authHeaders) return;

    try {
      const res = await fetch(`${API_BASE}/auth/stocks`, { headers: authHeaders });
      if (!res.ok) throw new Error("Stocks API failed");
      const data = await res.json();
      // Filter to unique stocks based on symbol
      const uniqueStocks = data.filter((stock, index, self) =>
        self.findIndex(s => s.symbol === stock.symbol) === index
      );
      setStocks(uniqueStocks);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async (symbol) => {
    if (!authHeaders) return;
    try {
      const res = await fetch(`${API_BASE}/auth/stock/${symbol}`, { headers: authHeaders });
      if (!res.ok) throw new Error("Stock fetch failed");
      const stockData = await res.json();
      setSearchedStock(stockData);
      setSelectedStock(symbol);
    } catch (err) {
      console.error(err.message);
      setSearchedStock(null);
    }
  };

  const fetchStockHistory = async (symbol) => {
    if (!authHeaders) return;
    try {
      const res = await fetch(`${API_BASE}/auth/stocks/history/${symbol}`, { headers: authHeaders });
      if (!res.ok) throw new Error("History fetch failed");
      setStockHistory(await res.json());
    } catch (err) {
      console.error(err.message);
      setStockHistory([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-50 text-xl">Loading...</div>
      </div>
    );
  }

  const selectedStockData = stocks.find(stock => stock.symbol === selectedStock);

  // Candlestick chart (approximated with bar chart for price history)
  const candlestickChartData = {
    labels: stockHistory.slice(0, 10).map(item => item.date),
    datasets: [{
      label: 'Price',
      data: stockHistory.slice(0, 10).map(item => item.price),
      backgroundColor: stockHistory.slice(0, 10).map(item => item.price > (stockHistory[0]?.price || 0) ?
        'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
      borderColor: stockHistory.slice(0, 10).map(item => item.price > (stockHistory[0]?.price || 0) ? '#22c55e' : '#ef4444'),
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  // Line chart for price history
  const lineChartData = {
    labels: stockHistory.slice(0, 10).map(item => item.date),
    datasets: [{
      label: 'Price',
      data: stockHistory.slice(0, 10).map(item => item.price),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  // Area chart (filled line) for price history
  const areaChartData = {
    labels: stockHistory.slice(0, 10).map(item => item.date),
    datasets: [{
      label: 'Price',
      data: stockHistory.slice(0, 10).map(item => item.price),
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  // Bar chart for volume comparison
  const volumeComparisonData = {
    labels: stocks.slice(0, 5).map(stock => stock.symbol),
    datasets: [{
      label: 'Volume',
      data: stocks.slice(0, 5).map(stock => stock.volume),
      backgroundColor: stocks.slice(0, 5).map(stock => stock.symbol === selectedStock ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)'),
      borderColor: stocks.slice(0, 5).map(stock => stock.symbol === selectedStock ? 'rgba(34, 197, 94, 1)' : 'rgba(59, 130, 246, 1)'),
      borderWidth: 1,
    }]
  };

  // Pie chart for market cap distribution
  const marketCapPieData = {
    labels: stocks.slice(0, 5).map(stock => stock.symbol),
    datasets: [{
      data: stocks.slice(0, 5).map(stock => stock.marketCap / 1000000000000), // Convert to trillions
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ],
      borderColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ],
      borderWidth: 1,
    }]
  };

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
              ChatGPT
            </button>
            <button
              onClick={() => navigate('/watchlist')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Watchlist
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
              <h1 className="text-3xl font-bold text-slate-50">Stock Watchlist</h1>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 rounded-xl border border-slate-700/50 transition"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>
          <div className="mb-8">
            <p className="text-slate-400">Select a company to view its data</p>
          </div>

        {/* Quick Watchlist */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-50 mb-4">Quick Watchlist</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stocks.slice(0, 5).map((stock) => (
              <div key={stock.symbol} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-700/70 transition cursor-pointer" onClick={() => setSelectedStock(stock.symbol)}>
                <div className="text-lg font-semibold text-slate-50">{stock.symbol}</div>
                <div className="text-2xl font-bold text-slate-50">${parseFloat(stock.price)?.toFixed(2) || 'N/A'}</div>
                <div className={`text-sm ${parseFloat(stock.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(stock.change) >= 0 ? '+' : ''}${parseFloat(stock.change)?.toFixed(2) || '0.00'} ({parseFloat(stock.changePercent)?.toFixed(2) || '0.00'}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Company Input */}
        <div className="mb-8">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={inputCompany}
              onChange={(e) => setInputCompany(e.target.value.toUpperCase())}
              placeholder="Enter company symbol (e.g., TCS, INFY)"
              className="flex-1 bg-slate-800/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                if (inputCompany.trim()) {
                  fetchStock(inputCompany.trim());
                }
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-6 py-2 rounded-xl font-semibold transition"
            >
              Show
            </button>
          </div>
        </div>

        {/* Company Selection Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {companies.map((company) => (
            <button
              key={company}
              onClick={() => setSelectedStock(company)}
              className={`p-4 rounded-xl border transition ${
                selectedStock === company
                  ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                  : 'bg-slate-800/50 text-slate-50 border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              <div className="text-lg font-semibold">{company}</div>
            </button>
          ))}
        </div>

        {/* Selected Stock Info */}
        {(selectedStockData || searchedStock) && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8">
            <h2 className="text-xl font-semibold text-slate-50 mb-4">{(selectedStockData || searchedStock).name} ({(selectedStockData || searchedStock).symbol})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-400">Price</div>
                <div className="text-2xl font-bold text-slate-50">${(selectedStockData || searchedStock).price?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Change</div>
                <div className={`text-xl font-semibold ${(selectedStockData || searchedStock).change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(selectedStockData || searchedStock).change >= 0 ? '+' : ''}${(selectedStockData || searchedStock).change?.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">% Change</div>
                <div className={`text-xl font-semibold ${(selectedStockData || searchedStock).changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(selectedStockData || searchedStock).changePercent >= 0 ? '+' : ''}{(selectedStockData || searchedStock).changePercent?.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Volume</div>
                <div className="text-xl font-semibold text-slate-50">{((selectedStockData || searchedStock).volume / 1000000)?.toFixed(1)}M</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Price History (Candlestick Chart)</h3>
            <div style={{ height: '300px' }}>
              <Bar data={candlestickChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Price History (Line Chart)</h3>
            <div style={{ height: '300px' }}>
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Price History (Area Chart)</h3>
            <div style={{ height: '300px' }}>
              <Line data={areaChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Volume Comparison (Bar Chart)</h3>
            <div style={{ height: '300px' }}>
              <Bar data={volumeComparisonData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Market Cap Distribution (Pie Chart)</h3>
            <div style={{ height: '300px' }}>
              <Pie data={marketCapPieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
